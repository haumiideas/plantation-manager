import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, isFirebaseConfigured } from '../config/firebase';
import { executeCloudWriteOrQueue } from './syncQueueService';
import { PlantationWorker } from '../types/worker';

const WORKERS_COLLECTION = 'workers';
const LOCAL_WORKERS_STORAGE_KEY = '@plantation_common_workers_v2';

// Realistic starter crew for shared plantation operations (Namari & Adukidathan)
const DEFAULT_PLANTATION_WORKERS: PlantationWorker[] = [
  {
    id: 'worker_001',
    orgId: 'plantation_org_namari_adukidathan',
    name: 'Muthusamy K.',
    phone: '+91 98421 00101',
    category: 'picker',
    crops: ['cardamom'],
    skills: ['Cardamom Picking', 'Capsule Grading'],
    dailyWageRate: 520,
    overtimeRatePerHour: 80,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'worker_002',
    orgId: 'plantation_org_namari_adukidathan',
    name: 'Selvi M.',
    phone: '+91 98421 00102',
    category: 'picker',
    crops: ['cardamom', 'pepper'],
    skills: ['Cardamom Picking', 'Pepper Plucking'],
    dailyWageRate: 520,
    overtimeRatePerHour: 80,
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'worker_003',
    orgId: 'plantation_org_namari_adukidathan',
    name: 'Somnath Das',
    phone: '+91 98421 00103',
    category: 'general',
    crops: ['cardamom', 'pepper'],
    skills: ['Trenching', 'Weeding', 'Loading'],
    dailyWageRate: 500,
    overtimeRatePerHour: 80,
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'worker_004',
    orgId: 'plantation_org_namari_adukidathan',
    name: 'Karthik Raja',
    phone: '+91 98421 00104',
    category: 'sprayer',
    crops: ['cardamom', 'pepper'],
    skills: ['Power Sprayer', 'Bordeaux Mixture', 'Foliar Feed'],
    dailyWageRate: 600,
    overtimeRatePerHour: 100,
    status: 'active',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'worker_005',
    orgId: 'plantation_org_namari_adukidathan',
    name: 'Mariammal P.',
    phone: '+91 98421 00105',
    category: 'weeder',
    crops: ['cardamom'],
    skills: ['Weeding & Mulching', 'Basin Cleaning'],
    dailyWageRate: 480,
    overtimeRatePerHour: 75,
    status: 'active',
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'worker_006',
    orgId: 'plantation_org_namari_adukidathan',
    name: 'Ganesan S.',
    phone: '+91 98421 00106',
    category: 'curing_crew',
    crops: ['cardamom'],
    skills: ['Curing Furnace Firing', 'Temperature Control', 'Fuelwood Management'],
    dailyWageRate: 580,
    overtimeRatePerHour: 95,
    status: 'active',
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'worker_007',
    orgId: 'plantation_org_namari_adukidathan',
    name: 'Ponnusamy T.',
    phone: '+91 94432 00201',
    category: 'picker',
    crops: ['pepper', 'cardamom'],
    skills: ['Vine Harvesting', 'Ladder Climbing'],
    dailyWageRate: 540,
    overtimeRatePerHour: 85,
    status: 'active',
    createdAt: '2026-02-10T08:00:00.000Z',
  },
  {
    id: 'worker_008',
    orgId: 'plantation_org_namari_adukidathan',
    name: 'Lakshmi V.',
    phone: '+91 94432 00202',
    category: 'picker',
    crops: ['cardamom'],
    skills: ['Cardamom Picking', 'Sorting'],
    dailyWageRate: 520,
    overtimeRatePerHour: 80,
    status: 'active',
    createdAt: '2026-02-10T08:00:00.000Z',
  },
  {
    id: 'worker_009',
    orgId: 'plantation_org_namari_adukidathan',
    name: 'Murugan C.',
    phone: '+91 94432 00203',
    category: 'picker',
    crops: ['pepper'],
    skills: ['Pepper Plucking', 'Drying Yard'],
    dailyWageRate: 520,
    overtimeRatePerHour: 80,
    status: 'active',
    createdAt: '2026-02-15T08:00:00.000Z',
  },
  {
    id: 'worker_010',
    orgId: 'plantation_org_namari_adukidathan',
    name: 'Chinnathambi R.',
    phone: '+91 94432 00204',
    category: 'sprayer',
    crops: ['pepper', 'cardamom'],
    skills: ['Spray Application', 'Fertigation'],
    dailyWageRate: 600,
    overtimeRatePerHour: 100,
    status: 'active',
    createdAt: '2026-02-15T08:00:00.000Z',
  },
];

/**
 * INSTANT LOCAL-FIRST LOADER:
 * Reads from local cache immediately (0ms latency).
 * Background fetches and syncs with Firestore if online.
 */
export async function getAllActiveWorkers(orgId: string): Promise<PlantationWorker[]> {
  // 1. Instant local read
  let cachedWorkers: PlantationWorker[] = [];
  try {
    const raw = await AsyncStorage.getItem(LOCAL_WORKERS_STORAGE_KEY);
    if (raw) {
      cachedWorkers = JSON.parse(raw);
    } else {
      cachedWorkers = DEFAULT_PLANTATION_WORKERS;
      await AsyncStorage.setItem(LOCAL_WORKERS_STORAGE_KEY, JSON.stringify(DEFAULT_PLANTATION_WORKERS));
    }
  } catch {
    cachedWorkers = DEFAULT_PLANTATION_WORKERS;
  }

  // Filter only active workers (workers who have not left the farm)
  const activeWorkers = cachedWorkers.filter((w) => w.status !== 'left_farm');

  // 2. Silent background sync with Firestore (does not block return)
  if (isFirebaseConfigured && db) {
    const firestoreDb = db;
    (async () => {
      try {
        const workersRef = collection(firestoreDb, WORKERS_COLLECTION);
        const q = query(workersRef, where('orgId', '==', orgId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const remoteList: PlantationWorker[] = [];
          snapshot.forEach((d) => remoteList.push(d.data() as PlantationWorker));
          await AsyncStorage.setItem(LOCAL_WORKERS_STORAGE_KEY, JSON.stringify(remoteList));
        } else {
          // Seed defaults to Firestore if empty
          DEFAULT_PLANTATION_WORKERS.forEach(async (w) => {
            const dRef = doc(firestoreDb, WORKERS_COLLECTION, w.id);
            await setDoc(dRef, w, { merge: true });
          });
        }
      } catch (err) {
        console.log('[workerService] Background sync idle (offline)');
      }
    })();
  }

  return activeWorkers;
}

/**
 * Retrieves all workers who have left the farm permanently
 */
export async function getLeftWorkers(orgId: string): Promise<PlantationWorker[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_WORKERS_STORAGE_KEY);
    const allWorkers: PlantationWorker[] = raw ? JSON.parse(raw) : DEFAULT_PLANTATION_WORKERS;
    return allWorkers.filter((w) => w.status === 'left_farm');
  } catch {
    return [];
  }
}

/**
 * Marks a worker as permanently left the farm.
 * Immediately removes them from the daily muster roster.
 */
export async function markWorkerLeftFarm(workerId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(LOCAL_WORKERS_STORAGE_KEY);
  const allWorkers: PlantationWorker[] = raw ? JSON.parse(raw) : DEFAULT_PLANTATION_WORKERS;
  const leftDate = new Date().toISOString();

  const updated = allWorkers.map((w) =>
    w.id === workerId ? { ...w, status: 'left_farm' as const, leftFarmDate: leftDate } : w
  );
  await AsyncStorage.setItem(LOCAL_WORKERS_STORAGE_KEY, JSON.stringify(updated));

  await executeCloudWriteOrQueue(WORKERS_COLLECTION, workerId, 'update', {
    status: 'left_farm',
    leftFarmDate: leftDate,
  });
}

/**
 * Reactivates a worker who has returned to the farm
 */
export async function reactivateWorker(workerId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(LOCAL_WORKERS_STORAGE_KEY);
  const allWorkers: PlantationWorker[] = raw ? JSON.parse(raw) : DEFAULT_PLANTATION_WORKERS;

  const updated = allWorkers.map((w) =>
    w.id === workerId ? { ...w, status: 'active' as const, leftFarmDate: undefined } : w
  );
  await AsyncStorage.setItem(LOCAL_WORKERS_STORAGE_KEY, JSON.stringify(updated));

  await executeCloudWriteOrQueue(WORKERS_COLLECTION, workerId, 'update', {
    status: 'active',
  });
}

/**
 * Updates a worker's standard base daily wage and OT rate for FUTURE attendance records.
 * Leaves past frozen attendance records completely unchanged.
 */
export async function updateWorkerWageRates(
  workerId: string,
  newDailyWage: number,
  newOtRate: number
): Promise<void> {
  const raw = await AsyncStorage.getItem(LOCAL_WORKERS_STORAGE_KEY);
  const allWorkers: PlantationWorker[] = raw ? JSON.parse(raw) : DEFAULT_PLANTATION_WORKERS;

  const updated = allWorkers.map((w) =>
    w.id === workerId
      ? { ...w, dailyWageRate: newDailyWage, overtimeRatePerHour: newOtRate }
      : w
  );
  await AsyncStorage.setItem(LOCAL_WORKERS_STORAGE_KEY, JSON.stringify(updated));

  await executeCloudWriteOrQueue(WORKERS_COLLECTION, workerId, 'update', {
    dailyWageRate: newDailyWage,
    overtimeRatePerHour: newOtRate,
  });
}

/**
 * Adds a new worker to the organization's common pool
 */
export async function addWorker(
  workerInput: Omit<PlantationWorker, 'id' | 'createdAt'>
): Promise<PlantationWorker> {
  const newId = `worker_${Date.now()}`;
  const newWorker: PlantationWorker = {
    ...workerInput,
    id: newId,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const raw = await AsyncStorage.getItem(LOCAL_WORKERS_STORAGE_KEY);
  const allWorkers: PlantationWorker[] = raw ? JSON.parse(raw) : DEFAULT_PLANTATION_WORKERS;
  allWorkers.push(newWorker);
  await AsyncStorage.setItem(LOCAL_WORKERS_STORAGE_KEY, JSON.stringify(allWorkers));

  await executeCloudWriteOrQueue(WORKERS_COLLECTION, newId, 'set', newWorker);

  return newWorker;
}
