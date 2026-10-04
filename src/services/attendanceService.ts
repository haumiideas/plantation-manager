import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, isFirebaseConfigured } from '../config/firebase';
import {
  executeCloudWriteOrQueue,
  enqueueBatchSyncOperations,
  isOnline,
} from './syncQueueService';
import { AttendanceRecord, AttendanceSummary, AttendanceStatus, EstateDayType } from '../types/attendance';
import { PlantationWorker } from '../types/worker';
import { FarmId } from '../types/farm';

const ATTENDANCE_COLLECTION = 'attendance';

function getStorageKey(farmId: FarmId, date: string): string {
  return `@plantation_attendance_records_${farmId}_${date}`;
}

export interface DayStatusConfig {
  date: string;
  status: EstateDayType;
  holidayReason?: string;
  updatedAt?: string;
}

function getDayStatusKey(farmId: FarmId, date: string): string {
  return `@plantation_day_status_${farmId}_${date}`;
}

export async function getDayStatus(
  farmId: FarmId,
  date: string
): Promise<DayStatusConfig> {
  const cacheKey = getDayStatusKey(farmId, date);
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { date, status: 'working_day' };
}

export async function saveDayStatus(
  farmId: FarmId,
  date: string,
  status: EstateDayType,
  holidayReason?: string
): Promise<void> {
  const cacheKey = getDayStatusKey(farmId, date);
  const data: DayStatusConfig = {
    date,
    status,
    holidayReason: holidayReason || '',
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
}

/**
 * INSTANT LOCAL-FIRST LOADER:
 * Reads from on-device storage immediately (0ms delay).
 * Silently updates from Firestore in the background.
 */
export async function getAttendanceForDateAndFarm(
  orgId: string,
  farmId: FarmId,
  date: string
): Promise<Record<string, AttendanceRecord>> {
  let localRecords: Record<string, AttendanceRecord> = {};

  if (farmId === 'consolidated') {
    // Read and merge records from all individual farms
    try {
      const namariKey = getStorageKey('namari', date);
      const adukiKey = getStorageKey('adukidathan', date);
      const [rawNamari, rawAduki] = await Promise.all([
        AsyncStorage.getItem(namariKey),
        AsyncStorage.getItem(adukiKey),
      ]);
      const namariMap: Record<string, AttendanceRecord> = rawNamari ? JSON.parse(rawNamari) : {};
      const adukiMap: Record<string, AttendanceRecord> = rawAduki ? JSON.parse(rawAduki) : {};
      localRecords = { ...namariMap, ...adukiMap };
    } catch {
      localRecords = {};
    }
  } else {
    const cacheKey = getStorageKey(farmId, date);
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        localRecords = JSON.parse(raw);
      }
    } catch {
      localRecords = {};
    }
  }

  // Silent background sync
  if (isFirebaseConfigured && db) {
    const firestoreDb = db;
    (async () => {
      try {
        const attendanceRef = collection(firestoreDb, ATTENDANCE_COLLECTION);
        let q = query(
          attendanceRef,
          where('orgId', '==', orgId),
          where('date', '==', date)
        );

        if (farmId !== 'consolidated') {
          q = query(
            attendanceRef,
            where('orgId', '==', orgId),
            where('date', '==', date),
            where('farmId', '==', farmId)
          );
        }

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          if (farmId === 'consolidated') {
            const namariMap: Record<string, AttendanceRecord> = {};
            const adukiMap: Record<string, AttendanceRecord> = {};
            snapshot.forEach((docSnap) => {
              const rec = docSnap.data() as AttendanceRecord;
              if (rec.farmId === 'namari') {
                namariMap[rec.workerId] = rec;
              } else {
                adukiMap[rec.workerId] = rec;
              }
            });
            await Promise.all([
              AsyncStorage.setItem(getStorageKey('namari', date), JSON.stringify(namariMap)),
              AsyncStorage.setItem(getStorageKey('adukidathan', date), JSON.stringify(adukiMap)),
            ]);
          } else {
            const remoteMap: Record<string, AttendanceRecord> = {};
            snapshot.forEach((docSnap) => {
              const rec = docSnap.data() as AttendanceRecord;
              remoteMap[rec.workerId] = rec;
            });
            await AsyncStorage.setItem(getStorageKey(farmId, date), JSON.stringify(remoteMap));
          }
        }
      } catch (e) {
        // Offline mode silent fallback
      }
    })();
  }

  return localRecords;
}

/**
 * Saves or updates an individual attendance record locally and syncs to cloud
 */
export async function saveAttendanceRecord(
  record: AttendanceRecord
): Promise<void> {
  const cacheKey = getStorageKey(record.farmId, record.date);

  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    const currentMap: Record<string, AttendanceRecord> = raw ? JSON.parse(raw) : {};
    currentMap[record.workerId] = record;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(currentMap));
  } catch (error) {
    console.warn('[attendanceService] Failed saving attendance locally:', error);
  }

  // Attempt direct cloud write if online, or enqueue into persistent AsyncStorage queue
  await executeCloudWriteOrQueue(
    ATTENDANCE_COLLECTION,
    record.id,
    'set',
    record,
    { merge: true }
  );
}

/**
 * Bulk action: Mark All Active Workers as Present
 * Captures their frozen base wage and OT rate snapshots for today.
 */
export async function markAllWorkersPresent(
  orgId: string,
  farmId: FarmId,
  date: string,
  workers: PlantationWorker[],
  recordedByUid: string,
  recordedByName: string,
  defaultTask: string = 'Cardamom Picking'
): Promise<Record<string, AttendanceRecord>> {
  const updatedMap: Record<string, AttendanceRecord> = {};
  const cacheKey = getStorageKey(farmId, date);
  const targetFarm: FarmId = farmId === 'consolidated' ? 'namari' : farmId;

  workers.forEach((worker) => {
    const id = `${targetFarm}_${date}_${worker.id}`;
    const record: AttendanceRecord = {
      id,
      orgId,
      farmId: targetFarm,
      date,
      workerId: worker.id,
      workerName: worker.name,
      category: worker.category,
      status: 'present',
      overtimeHours: 0,
      dailyWageRate: worker.dailyWageRate, // Immutable snapshot for this day
      overtimeRatePerHour: worker.overtimeRatePerHour, // Immutable snapshot for this day
      allocatedTask: defaultTask,
      block: targetFarm === 'namari' ? 'Ridge Block A' : 'Block 1',
      recordedByUid,
      recordedByName,
      updatedAt: new Date().toISOString(),
    };
    updatedMap[worker.id] = record;
  });

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedMap));
  } catch (storageErr) {
    console.warn('[attendanceService] Failed caching bulk attendance locally:', storageErr);
  }

  const syncOps = Object.values(updatedMap).map((rec) => ({
    collection: ATTENDANCE_COLLECTION,
    docId: rec.id,
    action: 'set' as const,
    payload: rec,
    options: { merge: true },
  }));

  const online = await isOnline();
  if (isFirebaseConfigured && db && online) {
    try {
      const firestoreDb = db;
      const batch = writeBatch(firestoreDb);
      Object.values(updatedMap).forEach((rec) => {
        const docRef = doc(firestoreDb, ATTENDANCE_COLLECTION, rec.id);
        batch.set(docRef, rec, { merge: true });
      });
      await batch.commit();
      console.log(`[attendanceService] Successfully synced batch of ${syncOps.length} attendance records to cloud`);
    } catch (batchErr) {
      console.warn('[attendanceService] Batch write failed, queueing all for offline sync:', batchErr);
      await enqueueBatchSyncOperations(syncOps);
    }
  } else if (isFirebaseConfigured && db) {
    console.log(`[attendanceService] Offline; queueing batch of ${syncOps.length} attendance records`);
    await enqueueBatchSyncOperations(syncOps);
  }

  return updatedMap;
}

/**
 * Bulk action: Clear/Reset Muster Selection back to Unmarked
 */
export async function clearAllAttendance(
  farmId: FarmId,
  date: string
): Promise<Record<string, AttendanceRecord>> {
  const cacheKey = getStorageKey(farmId, date);
  await AsyncStorage.setItem(cacheKey, JSON.stringify({}));
  return {};
}

/**
 * Overrides a worker's wage for TODAY ONLY (e.g. Somnath's ₹550 on 20-Sep for hard trench work).
 * Preserves his standard ₹500 base rate for yesterday and tomorrow.
 */
export async function overrideTodayWage(
  record: AttendanceRecord,
  overriddenDailyWage: number,
  overriddenOtRate: number
): Promise<AttendanceRecord> {
  const updated: AttendanceRecord = {
    ...record,
    dailyWageRate: overriddenDailyWage,
    overtimeRatePerHour: overriddenOtRate,
    isWageOverriddenToday: true,
    updatedAt: new Date().toISOString(),
  };

  await saveAttendanceRecord(updated);
  return updated;
}

/**
 * Calculates real-time daily muster totals using frozen wage snapshots.
 * Sensitive wage totals are returned strictly for Admins.
 */
export function calculateAttendanceSummary(
  recordsMap: Record<string, AttendanceRecord>,
  activeWorkers: PlantationWorker[],
  isAdmin: boolean
): AttendanceSummary {
  let presentCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;
  let unmarkedCount = 0;
  let totalOvertimeHours = 0;
  let totalEstimatedWage = 0;

  activeWorkers.forEach((worker) => {
    const record = recordsMap[worker.id];
    const status: AttendanceStatus = record ? record.status : 'unmarked';

    if (status === 'present') {
      presentCount++;
    } else if (status === 'half_day') {
      halfDayCount++;
    } else if (status === 'absent') {
      absentCount++;
    } else {
      unmarkedCount++;
    }

    if (record) {
      const ot = Number(record.overtimeHours) || 0;
      totalOvertimeHours += ot;

      if (isAdmin) {
        // Uses the point-in-time frozen wage snapshot from the record!
        const baseRate = record.dailyWageRate ?? worker.dailyWageRate ?? 500;
        const otRate = record.overtimeRatePerHour ?? worker.overtimeRatePerHour ?? 80;

        let dayWage = 0;
        if (status === 'present') {
          dayWage += baseRate;
        } else if (status === 'half_day') {
          dayWage += baseRate * 0.5;
        }

        // Add Overtime wages
        dayWage += ot * otRate;
        totalEstimatedWage += dayWage;
      }
    }
  });

  return {
    totalActiveWorkers: activeWorkers.length,
    presentCount,
    halfDayCount,
    absentCount,
    unmarkedCount,
    totalOvertimeHours,
    totalEstimatedWage: isAdmin ? Math.round(totalEstimatedWage) : 0,
  };
}
