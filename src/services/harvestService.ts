import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, isFirebaseConfigured } from '../config/firebase';
import { FarmId } from '../types/farm';
import { CropConfig, CROPS_CONFIG } from '../types/crop';
import {
  HarvestEntry,
  CuringBatch,
  PepperDryingBatch,
  HarvestSummary,
  DryerComparisonSummary,
  DryerComparisonItem,
  CardamomGrading,
  FiringLogEntry,
  FlushSummary,
  DEFAULT_ESTATE_BENCHMARKS,
  ESTATE_ACREAGES,
  DEFAULT_CONTRACTOR_GROUPS,
  ContractorGroupConfig,
  ConsolidatedSeasonIntelligence,
  FuelConsumption,
  PackagingItemUsed,
} from '../types/harvest';
import { formatDate } from '../utils/date';

const HARVEST_COLLECTION = 'harvest';
const CURING_COLLECTION = 'curing';
const PEPPER_COLLECTION = 'pepper_batches';

function getHarvestKey(orgId: string): string {
  return `@plantation_harvest_entries_${orgId}_v2`;
}

function getCuringKey(orgId: string): string {
  return `@plantation_curing_batches_${orgId}_v2`;
}

function getPepperKey(orgId: string): string {
  return `@plantation_pepper_batches_${orgId}_v2`;
}

function getCropsKey(orgId: string): string {
  return `@plantation_custom_crops_${orgId}`;
}

function getBenchmarksKey(orgId: string): string {
  return `@plantation_benchmarks_${orgId}`;
}

function getFlushLocksKey(orgId: string): string {
  return `@plantation_flush_locks_${orgId}`;
}

function getContractorGroupsKey(orgId: string): string {
  return `@plantation_contractor_groups_${orgId}`;
}

// Initial realistic seed data for Namari & Adukidathan with labor gangs and tare weights
const INITIAL_HARVEST_ENTRIES: HarvestEntry[] = [
  {
    id: 'HARV-2026-09-01',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'namari',
    date: '20-Sep-2026',
    dayOfWeek: 'Sunday',
    cropId: 'cardamom',
    cropName: 'Small Cardamom',
    blockName: 'Ridge Block A',
    entryMode: 'labor_gang',
    workerCount: 14,
    freshPackagingItems: [
      { id: 'p-1', name: 'Fresh PP Picking Sack', quantity: 10, tarePerUnitKg: 0.2, totalTareKg: 2.0 },
    ],
    totalFreshTareKg: 2.0,
    freshSacksCount: 10,
    sackTareWeightKg: 0.2,
    freshWeightGrossKg: 382.0,
    freshWeightNetKg: 380.0,
    totalWeightKg: 380.0,
    flushNumber: '2nd Flush',
    isFlushLocked: false,
    dryPackagingItems: [
      { id: 'p-2', name: 'Gunny / Jute Storage Bag', quantity: 2, tarePerUnitKg: 1.1, totalTareKg: 2.2 },
      { id: 'p-3', name: 'Plastic Inner Liner Bag', quantity: 2, tarePerUnitKg: 0.1, totalTareKg: 0.2 },
    ],
    totalDryTareKg: 2.4,
    dryWeightGrossKg: 83.4,
    dryWeightNetKg: 81.0,
    freshToDryRatio: 4.69,
    dryStorageSacksCount: 2,
    dryStoragePlasticBagsCount: 2,
    laborGroups: [
      {
        id: 'lg-1',
        groupId: 'cg_own_estate',
        groupType: 'own_estate',
        groupName: 'Own Estate workers',
        workerCount: 6,
        totalWeightKg: 180.0,
        kgPerPersonPerDay: 30.0,
      },
      {
        id: 'lg-2',
        groupId: 'cg_boopathi',
        groupType: 'boopathi',
        groupName: 'Boopathi workers',
        workerCount: 8,
        totalWeightKg: 200.0,
        kgPerPersonPerDay: 25.0,
      },
    ],
    qualityNotes: 'Bold green capsules, clean plucking without tail stalk. 2 gunny sacks with plastic liners stored.',
    createdAt: '2026-09-20T10:30:00.000Z',
  },
  {
    id: 'HARV-2026-09-02',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'adukidathan',
    date: '19-Sep-2026',
    dayOfWeek: 'Saturday',
    cropId: 'cardamom',
    cropName: 'Small Cardamom',
    blockName: 'Valley Block B',
    entryMode: 'labor_gang',
    workerCount: 12,
    freshPackagingItems: [
      { id: 'p-4', name: 'Fresh PP Picking Sack', quantity: 8, tarePerUnitKg: 0.2, totalTareKg: 1.6 },
    ],
    totalFreshTareKg: 1.6,
    freshSacksCount: 8,
    sackTareWeightKg: 0.2,
    freshWeightGrossKg: 327.6,
    freshWeightNetKg: 326.0,
    totalWeightKg: 326.0,
    flushNumber: '2nd Flush',
    isFlushLocked: false,
    dryPackagingItems: [
      { id: 'p-5', name: 'Gunny / Jute Storage Bag', quantity: 2, tarePerUnitKg: 1.1, totalTareKg: 2.2 },
      { id: 'p-6', name: 'Plastic Inner Liner Bag', quantity: 2, tarePerUnitKg: 0.1, totalTareKg: 0.2 },
    ],
    totalDryTareKg: 2.4,
    dryWeightGrossKg: 71.9,
    dryWeightNetKg: 69.5,
    freshToDryRatio: 4.69,
    dryStorageSacksCount: 2,
    dryStoragePlasticBagsCount: 2,
    laborGroups: [
      {
        id: 'lg-3',
        groupId: 'cg_own_estate',
        groupType: 'own_estate',
        groupName: 'Own Estate workers',
        workerCount: 5,
        totalWeightKg: 145.0,
        kgPerPersonPerDay: 29.0,
      },
      {
        id: 'lg-4',
        groupId: 'cg_thangamani',
        groupType: 'thangamani',
        groupName: 'Thangamani workers',
        workerCount: 7,
        totalWeightKg: 181.0,
        kgPerPersonPerDay: 25.86,
      },
    ],
    pickerEntries: [
      { workerId: 'w-1', workerName: 'Somnath Roy', weightKg: 28.5 },
      { workerId: 'w-2', workerName: 'Priya Murugan', weightKg: 34.0 },
      { workerId: 'w-3', workerName: 'Manikandan K', weightKg: 32.0 },
    ],
    qualityNotes: 'High picker output, uniform bold green capsules.',
    createdAt: '2026-09-19T11:15:00.000Z',
  },
  {
    id: 'HARV-2026-09-03',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'namari',
    date: '18-Sep-2026',
    dayOfWeek: 'Friday',
    cropId: 'pepper',
    cropName: 'Black Pepper',
    blockName: 'Block 1 (Intercropped)',
    entryMode: 'bulk',
    workerCount: 8,
    freshPackagingItems: [
      { id: 'p-7', name: 'Fresh PP Picking Sack', quantity: 6, tarePerUnitKg: 0.2, totalTareKg: 1.2 },
    ],
    totalFreshTareKg: 1.2,
    freshSacksCount: 6,
    sackTareWeightKg: 0.2,
    freshWeightGrossKg: 241.2,
    freshWeightNetKg: 240.0,
    totalWeightKg: 240.0,
    qualityNotes: 'Spikes with 1-2 berries turning red, prime maturity for bold black pepper.',
    createdAt: '2026-09-18T16:00:00.000Z',
  },
];

const INITIAL_CURING_BATCHES: CuringBatch[] = [
  {
    id: 'CUR-2026-09-01',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'namari',
    status: 'completed',
    seasonYear: '2026-27',
    dryerType: 'own',
    dryerName: 'Namari Own Chamber 1',
    greenWeightKg: 1000,
    dryWeightKg: 214,
    benchmarkOutturnPercentage: 20.0,
    recoveryPercentage: 21.4,
    varianceFromBenchmark: 1.4,
    freshToDryRatio: 4.67,
    dryStorageSacksCount: 4,
    dryStoragePlasticBagsCount: 4,
    runningDays: 1.5,
    fuelConsumed: {
      firewoodBundles: 22,
      dieselLiters: 4,
      petrolLiters: 0,
      engineOilLiters: 0.5,
    },
    loadDate: '17-Sep-2026 08:00',
    unloadDate: '18-Sep-2026 18:30',
    totalFirewoodConsumed: 22,
    firingLogs: [
      { id: 'f-1', timestamp: '17-Sep-2026 09:00', tempCelsius: 44, firewoodBundles: 6, notes: 'Initial firing, sweating stage' },
      { id: 'f-2', timestamp: '17-Sep-2026 15:00', tempCelsius: 48, firewoodBundles: 8, notes: 'Main drying run, consistent flue heat' },
      { id: 'f-3', timestamp: '18-Sep-2026 08:00', tempCelsius: 51, firewoodBundles: 8, notes: 'Final crisping stage, aroma strong' },
    ],
    grades: {
      grade8mmPlusKg: 132,
      grade7to8mmKg: 64,
      gradeSplitsKg: 15,
      gradeHuskSeedsKg: 3,
      gradedDate: '19-Sep-2026',
    },
    notes: 'Stored in 4 gunny sacks with heavy food-grade plastic liner bags to seal aroma.',
    createdAt: '2026-09-17T08:00:00.000Z',
  },
  {
    id: 'CUR-2026-09-02',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'adukidathan',
    status: 'completed',
    seasonYear: '2026-27',
    dryerType: 'rented',
    dryerName: 'Mani Dryer (Vandiperiyar)',
    rentedDryerContact: '+91 94471 23456',
    rentalCostPerKg: 12,
    greenWeightKg: 850,
    dryWeightKg: 165,
    benchmarkOutturnPercentage: 20.0,
    recoveryPercentage: 19.41,
    varianceFromBenchmark: -0.59,
    freshToDryRatio: 5.15,
    dryStorageSacksCount: 3,
    dryStoragePlasticBagsCount: 3,
    runningDays: 1.5,
    fuelConsumed: {
      firewoodBundles: 20,
      dieselLiters: 0,
      petrolLiters: 0,
      engineOilLiters: 0,
    },
    loadDate: '14-Sep-2026 10:00',
    unloadDate: '15-Sep-2026 21:00',
    totalFirewoodConsumed: 20,
    firingLogs: [
      { id: 'f-4', timestamp: '14-Sep-2026 11:00', tempCelsius: 45, firewoodBundles: 10 },
      { id: 'f-5', timestamp: '15-Sep-2026 12:00', tempCelsius: 53, firewoodBundles: 10, notes: 'Chamber ran slightly hot in evening' },
    ],
    grades: {
      grade8mmPlusKg: 88,
      grade7to8mmKg: 58,
      gradeSplitsKg: 16,
      gradeHuskSeedsKg: 3,
      gradedDate: '16-Sep-2026',
    },
    notes: 'Rented dryer ran warmer than standard; recovery was 19.41% (-0.59% below 20% benchmark).',
    createdAt: '2026-09-14T10:00:00.000Z',
  },
  {
    id: 'CUR-2026-09-03',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'namari',
    status: 'firing',
    seasonYear: '2026-27',
    dryerType: 'own',
    dryerName: 'Namari Own Chamber 2',
    greenWeightKg: 720,
    benchmarkOutturnPercentage: 20.0,
    loadDate: '20-Sep-2026 09:00',
    runningDays: 0.5,
    fuelConsumed: {
      firewoodBundles: 8,
      dieselLiters: 2,
      petrolLiters: 0,
      engineOilLiters: 0.2,
    },
    totalFirewoodConsumed: 8,
    firingLogs: [
      { id: 'f-6', timestamp: '20-Sep-2026 10:00', tempCelsius: 43, firewoodBundles: 4, notes: 'Sweating stage started' },
      { id: 'f-7', timestamp: '20-Sep-2026 14:00', tempCelsius: 47, firewoodBundles: 4, notes: 'Exhaust blower operational' },
    ],
    notes: 'Currently in chamber firing. Projected unload tomorrow morning.',
    createdAt: '2026-09-20T09:00:00.000Z',
  },
  // Previous season seed batch for yearly comparison
  {
    id: 'CUR-2025-10-01',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'namari',
    status: 'completed',
    seasonYear: '2025-26',
    dryerType: 'own',
    dryerName: 'Namari Own Chamber 1',
    greenWeightKg: 4200,
    dryWeightKg: 890,
    benchmarkOutturnPercentage: 20.0,
    recoveryPercentage: 21.19,
    varianceFromBenchmark: 1.19,
    freshToDryRatio: 4.72,
    dryStorageSacksCount: 16,
    dryStoragePlasticBagsCount: 16,
    runningDays: 2.0,
    fuelConsumed: {
      firewoodBundles: 95,
      dieselLiters: 15,
      petrolLiters: 0,
      engineOilLiters: 1.5,
    },
    loadDate: '15-Oct-2025 09:00',
    unloadDate: '16-Oct-2025 20:00',
    totalFirewoodConsumed: 95,
    firingLogs: [],
    grades: {
      grade8mmPlusKg: 540,
      grade7to8mmKg: 280,
      gradeSplitsKg: 55,
      gradeHuskSeedsKg: 15,
      gradedDate: '18-Oct-2025',
    },
    notes: '2025-26 Peak harvest season. Cured in own chamber.',
    createdAt: '2025-10-15T09:00:00.000Z',
  },
  {
    id: 'CUR-2025-10-02',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'adukidathan',
    status: 'completed',
    seasonYear: '2025-26',
    dryerType: 'rented',
    dryerName: 'Kumily Central Dryer',
    rentalCostPerKg: 11,
    greenWeightKg: 3600,
    dryWeightKg: 695,
    benchmarkOutturnPercentage: 20.0,
    recoveryPercentage: 19.31,
    varianceFromBenchmark: -0.69,
    freshToDryRatio: 5.18,
    dryStorageSacksCount: 12,
    dryStoragePlasticBagsCount: 12,
    runningDays: 2.0,
    fuelConsumed: {
      firewoodBundles: 85,
      dieselLiters: 0,
      petrolLiters: 0,
      engineOilLiters: 0,
    },
    loadDate: '20-Oct-2025 10:00',
    unloadDate: '21-Oct-2025 22:00',
    totalFirewoodConsumed: 85,
    firingLogs: [],
    notes: '2025-26 Rented drying run during heavy crop peak.',
    createdAt: '2025-10-20T10:00:00.000Z',
  },
];

const INITIAL_PEPPER_BATCHES: PepperDryingBatch[] = [
  {
    id: 'PEP-2026-09-01',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'namari',
    status: 'drying',
    seasonYear: '2026-27',
    freshSpikesWeightKg: 420,
    threshedBerriesWeightKg: 360,
    benchmarkOutturnPercentage: 34.0,
    dryingDays: 4,
    startDate: '16-Sep-2026',
    notes: 'Solar drying in main concrete yard. Raked every 2 hours under peak sun.',
    createdAt: '2026-09-16T14:00:00.000Z',
  },
];

// -------------------------------------------------------------
// HARVEST ENTRIES (Local First + Cloud Sync)
// -------------------------------------------------------------
export async function getHarvestEntries(
  orgId: string,
  farmId?: FarmId,
  cropId?: string
): Promise<HarvestEntry[]> {
  const key = getHarvestKey(orgId);
  let entries: HarvestEntry[] = [];

  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      entries = JSON.parse(raw);
    } else {
      entries = INITIAL_HARVEST_ENTRIES;
      await AsyncStorage.setItem(key, JSON.stringify(entries));
    }
  } catch {
    entries = INITIAL_HARVEST_ENTRIES;
  }

  // Background Cloud Sync
  if (isFirebaseConfigured && db) {
    const firestoreDb = db;
    (async () => {
      try {
        const harvestRef = collection(firestoreDb, HARVEST_COLLECTION);
        const q = query(harvestRef, where('orgId', '==', orgId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const cloudEntries = snapshot.docs.map((d) => d.data() as HarvestEntry);
          await AsyncStorage.setItem(key, JSON.stringify(cloudEntries));
        }
      } catch (e) {
        // Silent offline
      }
    })();
  }

  return entries.filter((e) => {
    if (farmId && farmId !== 'consolidated' && e.farmId !== farmId) return false;
    if (cropId && cropId !== 'all' && e.cropId !== cropId) return false;
    return true;
  });
}

export async function saveHarvestEntry(
  entry: Omit<HarvestEntry, 'id' | 'createdAt'>
): Promise<HarvestEntry> {
  const newEntry: HarvestEntry = {
    ...entry,
    id: `HARV-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };

  const key = getHarvestKey(entry.orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    const list: HarvestEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(newEntry);
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    // continue
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, HARVEST_COLLECTION, newEntry.id), newEntry);
    } catch (e) {
      // Saved locally
    }
  }

  return newEntry;
}

export async function updateHarvestEntry(entry: HarvestEntry): Promise<HarvestEntry> {
  const updatedEntry: HarvestEntry = {
    ...entry,
    updatedAt: new Date().toISOString(),
  };

  const key = getHarvestKey(entry.orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const list: HarvestEntry[] = JSON.parse(raw);
      const idx = list.findIndex((e) => e.id === entry.id);
      if (idx !== -1) {
        list[idx] = updatedEntry;
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
    }
  } catch (err) {
    // continue
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, HARVEST_COLLECTION, entry.id), updatedEntry);
    } catch (e) {
      // updated locally
    }
  }

  return updatedEntry;
}

export async function deleteHarvestEntry(orgId: string, entryId: string): Promise<void> {
  const key = getHarvestKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const list: HarvestEntry[] = JSON.parse(raw);
      const filtered = list.filter((e) => e.id !== entryId);
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch (err) {
    // continue
  }

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, HARVEST_COLLECTION, entryId));
    } catch (e) {
      // delete locally
    }
  }
}

// -------------------------------------------------------------
// FLUSH LOCKING & FLUSH SUMMARY
// -------------------------------------------------------------
export async function getFlushLocks(orgId: string): Promise<Record<string, boolean>> {
  const key = getFlushLocksKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // continue
  }
  return {};
}

export async function toggleFlushLock(
  orgId: string,
  flushNumber: string,
  isLocked: boolean
): Promise<void> {
  const key = getFlushLocksKey(orgId);
  let locks: Record<string, boolean> = {};
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) locks = JSON.parse(raw);
    locks[flushNumber] = isLocked;
    await AsyncStorage.setItem(key, JSON.stringify(locks));
  } catch {
    // continue
  }

  // Update entries under this flush to freeze them
  const harvestKey = getHarvestKey(orgId);
  try {
    const rawEntries = await AsyncStorage.getItem(harvestKey);
    if (rawEntries) {
      const list: HarvestEntry[] = JSON.parse(rawEntries);
      const updated = list.map((e) =>
        e.flushNumber === flushNumber ? { ...e, isFlushLocked: isLocked } : e
      );
      await AsyncStorage.setItem(harvestKey, JSON.stringify(updated));
    }
  } catch {
    // continue
  }
}

export function calculateFlushSummary(
  entries: HarvestEntry[],
  flushNumber: string,
  farmId: FarmId = 'namari',
  customAcreage?: number
): FlushSummary {
  const flushEntries = entries.filter((e) => e.flushNumber === flushNumber);
  const acreage = customAcreage && customAcreage > 0 ? customAcreage : (ESTATE_ACREAGES[farmId] || 25);

  let totalFreshGrossKg = 0;
  let totalFreshNetKg = 0;
  let totalDryNetKg = 0;
  let totalWorkerHeadcount = 0;
  const uniqueDates = new Set<string>();
  let isLocked = false;

  for (const entry of flushEntries) {
    totalFreshGrossKg += entry.freshWeightGrossKg || entry.totalWeightKg;
    totalFreshNetKg += entry.freshWeightNetKg || entry.totalWeightKg;
    totalDryNetKg += entry.dryWeightNetKg || (entry.freshWeightNetKg ? entry.freshWeightNetKg * 0.21 : 0);
    totalWorkerHeadcount += entry.workerCount || 0;
    uniqueDates.add(entry.date);
    if (entry.isFlushLocked) isLocked = true;
  }

  const freshKgPerAcre = acreage > 0 ? Number((totalFreshNetKg / acreage).toFixed(1)) : 0;
  const dryKgPerAcre = acreage > 0 ? Number((totalDryNetKg / acreage).toFixed(1)) : 0;
  const totalPickingDays = uniqueDates.size;
  const averageKgPerWorker =
    totalWorkerHeadcount > 0 ? Number((totalFreshNetKg / totalWorkerHeadcount).toFixed(1)) : 0;

  return {
    flushNumber,
    isLocked,
    totalFreshGrossKg: Number(totalFreshGrossKg.toFixed(1)),
    totalFreshNetKg: Number(totalFreshNetKg.toFixed(1)),
    totalDryNetKg: Number(totalDryNetKg.toFixed(1)),
    acreage,
    freshKgPerAcre,
    dryKgPerAcre,
    totalPickingDays,
    totalWorkerHeadcount,
    averageKgPerWorker,
  };
}

// -------------------------------------------------------------
// CURING BATCHES (Cardamom Dryer Ledger)
// -------------------------------------------------------------
export async function getCuringBatches(
  orgId: string,
  farmId?: FarmId
): Promise<CuringBatch[]> {
  const key = getCuringKey(orgId);
  let batches: CuringBatch[] = [];

  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      batches = JSON.parse(raw);
    } else {
      batches = INITIAL_CURING_BATCHES;
      await AsyncStorage.setItem(key, JSON.stringify(batches));
    }
  } catch {
    batches = INITIAL_CURING_BATCHES;
  }

  if (isFirebaseConfigured && db) {
    const firestoreDb = db;
    (async () => {
      try {
        const curingRef = collection(firestoreDb, CURING_COLLECTION);
        const q = query(curingRef, where('orgId', '==', orgId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const cloudBatches = snapshot.docs.map((d) => d.data() as CuringBatch);
          await AsyncStorage.setItem(key, JSON.stringify(cloudBatches));
        }
      } catch (e) {
        // Silently offline
      }
    })();
  }

  return batches.filter((b) => {
    if (farmId && farmId !== 'consolidated' && b.farmId !== farmId) return false;
    return true;
  });
}

export async function createCuringBatch(
  batchData: Omit<CuringBatch, 'id' | 'createdAt' | 'status' | 'firingLogs' | 'totalFirewoodConsumed' | 'runningDays' | 'fuelConsumed'> & {
    runningDays?: number;
    fuelConsumed?: FuelConsumption;
  }
): Promise<CuringBatch> {
  const newBatch: CuringBatch = {
    ...batchData,
    id: `CUR-${Date.now().toString(36).toUpperCase()}`,
    status: 'firing',
    seasonYear: batchData.seasonYear || '2026-27',
    runningDays: batchData.runningDays !== undefined ? batchData.runningDays : 1.0,
    fuelConsumed: batchData.fuelConsumed || {
      firewoodBundles: 6,
      dieselLiters: 0,
      petrolLiters: 0,
      engineOilLiters: 0,
    },
    firingLogs: [],
    totalFirewoodConsumed: 0,
    createdAt: new Date().toISOString(),
  };

  const key = getCuringKey(newBatch.orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    const list: CuringBatch[] = raw ? JSON.parse(raw) : [];
    list.unshift(newBatch);
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    // continue
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, CURING_COLLECTION, newBatch.id), newBatch);
    } catch (e) {
      // saved locally
    }
  }

  return newBatch;
}

export async function updateCuringBatch(
  batch: CuringBatch
): Promise<CuringBatch> {
  const key = getCuringKey(batch.orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const list: CuringBatch[] = JSON.parse(raw);
      const idx = list.findIndex((b) => b.id === batch.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...batch };
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
    }
  } catch {}

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, CURING_COLLECTION, batch.id), batch, { merge: true });
    } catch {}
  }
  return batch;
}

const DEFAULT_DRYER_CHAMBERS: string[] = [];

function getDryerChambersKey(orgId: string): string {
  return `@plantation_dryer_chambers_${orgId}`;
}

export async function getCustomDryerChambers(orgId: string): Promise<string[]> {
  const key = getDryerChambersKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function addCustomDryerChamber(orgId: string, chamberName: string): Promise<string[]> {
  const key = getDryerChambersKey(orgId);
  const current = await getCustomDryerChambers(orgId);
  const trimmed = chamberName.trim();
  if (trimmed && !current.includes(trimmed)) {
    current.push(trimmed);
    await AsyncStorage.setItem(key, JSON.stringify(current));
  }
  return current;
}

function getCustomCropsKey(orgId: string): string {
  return `@plantation_custom_crops_${orgId}`;
}

export async function getCustomExpenseCrops(orgId: string): Promise<string[]> {
  const key = getCustomCropsKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function addCustomExpenseCrop(orgId: string, cropName: string): Promise<string[]> {
  const key = getCustomCropsKey(orgId);
  const current = await getCustomExpenseCrops(orgId);
  const trimmed = cropName.trim();
  if (trimmed && !current.includes(trimmed)) {
    current.push(trimmed);
    await AsyncStorage.setItem(key, JSON.stringify(current));
  }
  return current;
}

export async function deleteCustomExpenseCrop(orgId: string, cropName: string): Promise<string[]> {
  const key = getCustomCropsKey(orgId);
  const current = await getCustomExpenseCrops(orgId);
  const updated = current.filter((c) => c.toLowerCase() !== cropName.trim().toLowerCase());
  await AsyncStorage.setItem(key, JSON.stringify(updated));
  return updated;
}


function getFieldBlocksKey(orgId: string, cropId: string): string {
  return `@plantation_custom_blocks_${orgId}_${cropId}`;
}

export async function getCustomFieldBlocks(orgId: string, cropId: string): Promise<string[]> {
  const key = getFieldBlocksKey(orgId, cropId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function addCustomFieldBlock(orgId: string, cropId: string, blockName: string): Promise<string[]> {
  const key = getFieldBlocksKey(orgId, cropId);
  const current = await getCustomFieldBlocks(orgId, cropId);
  if (!current.includes(blockName)) {
    current.push(blockName);
    await AsyncStorage.setItem(key, JSON.stringify(current));
  }
  return current;
}

export async function addFiringLog(
  orgId: string,
  batchId: string,
  logEntry: Omit<FiringLogEntry, 'id'>
): Promise<CuringBatch | null> {
  const key = getCuringKey(orgId);
  let updatedBatch: CuringBatch | null = null;

  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const list: CuringBatch[] = JSON.parse(raw);
      const idx = list.findIndex((b) => b.id === batchId);
      if (idx !== -1) {
        const fullLog: FiringLogEntry = {
          ...logEntry,
          id: `f-${Date.now()}`,
        };
        list[idx].firingLogs.push(fullLog);
        list[idx].totalFirewoodConsumed = (list[idx].totalFirewoodConsumed || 0) + logEntry.firewoodBundles;
        if (list[idx].fuelConsumed) {
          list[idx].fuelConsumed.firewoodBundles =
            (list[idx].fuelConsumed.firewoodBundles || 0) + logEntry.firewoodBundles;
        }
        updatedBatch = list[idx];
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
    }
  } catch (err) {
    // continue
  }

  if (updatedBatch && isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, CURING_COLLECTION, batchId), updatedBatch);
    } catch (e) {
      // local updated
    }
  }

  return updatedBatch;
}

export async function completeCuringBatch(
  orgId: string,
  batchId: string,
  dryWeightKg: number,
  unloadDate: string,
  grades?: CardamomGrading,
  dryStorageSacksCount?: number,
  dryStoragePlasticBagsCount?: number,
  additionalFuel?: Partial<FuelConsumption>,
  runningDays?: number,
  dryPackagingItems?: PackagingItemUsed[],
  ripenedFruitDryKg?: number
): Promise<CuringBatch | null> {
  const key = getCuringKey(orgId);
  let updatedBatch: CuringBatch | null = null;

  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const list: CuringBatch[] = JSON.parse(raw);
      const idx = list.findIndex((b) => b.id === batchId);
      if (idx !== -1) {
        const batch = list[idx];
        const recoveryPct = Number(((dryWeightKg / batch.greenWeightKg) * 100).toFixed(2));
        const variance = Number((recoveryPct - batch.benchmarkOutturnPercentage).toFixed(2));
        const ratio = dryWeightKg > 0 ? Number((batch.greenWeightKg / dryWeightKg).toFixed(2)) : undefined;

        batch.dryWeightKg = dryWeightKg;
        batch.unloadDate = unloadDate;
        batch.recoveryPercentage = recoveryPct;
        batch.varianceFromBenchmark = variance;
        batch.freshToDryRatio = ratio;
        batch.dryStorageSacksCount = dryStorageSacksCount;
        batch.dryStoragePlasticBagsCount = dryStoragePlasticBagsCount;

        if (ripenedFruitDryKg !== undefined && ripenedFruitDryKg > 0) {
          batch.ripenedFruitDryKg = ripenedFruitDryKg;
          if (batch.ripenedFruitLoadedKg && batch.ripenedFruitLoadedKg > 0) {
            batch.ripenedFruitRecoveryPct = Number(((ripenedFruitDryKg / batch.ripenedFruitLoadedKg) * 100).toFixed(2));
            const totalLoaded = batch.greenWeightKg + batch.ripenedFruitLoadedKg;
            const totalDry = dryWeightKg + ripenedFruitDryKg;
            batch.overallRecoveryPct = Number(((totalDry / totalLoaded) * 100).toFixed(2));
          }
        }

        if (runningDays !== undefined) {
          batch.runningDays = runningDays;
        }
        if (additionalFuel && batch.fuelConsumed) {
          batch.fuelConsumed = {
            firewoodBundles: (batch.fuelConsumed.firewoodBundles || 0) + (additionalFuel.firewoodBundles || 0),
            dieselLiters: (batch.fuelConsumed.dieselLiters || 0) + (additionalFuel.dieselLiters || 0),
            petrolLiters: (batch.fuelConsumed.petrolLiters || 0) + (additionalFuel.petrolLiters || 0),
            engineOilLiters: (batch.fuelConsumed.engineOilLiters || 0) + (additionalFuel.engineOilLiters || 0),
          };
        }
        if (dryPackagingItems) {
          batch.dryPackagingItems = dryPackagingItems;
        }
        batch.status = grades ? 'graded' : 'completed';
        if (grades) {
          batch.grades = grades;
        }

        updatedBatch = batch;
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
    }
  } catch (err) {
    // continue
  }

  if (updatedBatch && isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, CURING_COLLECTION, batchId), updatedBatch);
    } catch (e) {
      // local updated
    }
  }

  return updatedBatch;
}

// -------------------------------------------------------------
// PEPPER SOLAR YARD BATCHES
// -------------------------------------------------------------
export async function getPepperBatches(
  orgId: string,
  farmId?: FarmId
): Promise<PepperDryingBatch[]> {
  const key = getPepperKey(orgId);
  let batches: PepperDryingBatch[] = [];

  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      batches = JSON.parse(raw);
    } else {
      batches = INITIAL_PEPPER_BATCHES;
      await AsyncStorage.setItem(key, JSON.stringify(batches));
    }
  } catch {
    batches = INITIAL_PEPPER_BATCHES;
  }

  return batches.filter((b) => {
    if (farmId && farmId !== 'consolidated' && b.farmId !== farmId) return false;
    return true;
  });
}

export async function createPepperBatch(
  batchData: Omit<PepperDryingBatch, 'id' | 'createdAt' | 'status'>
): Promise<PepperDryingBatch> {
  const newBatch: PepperDryingBatch = {
    ...batchData,
    id: `PEP-${Date.now().toString(36).toUpperCase()}`,
    seasonYear: batchData.seasonYear || '2026-27',
    status: 'drying',
    createdAt: new Date().toISOString(),
  };

  const key = getPepperKey(newBatch.orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    const list: PepperDryingBatch[] = raw ? JSON.parse(raw) : [];
    list.unshift(newBatch);
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    // continue
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, PEPPER_COLLECTION, newBatch.id), newBatch);
    } catch (e) {
      // saved locally
    }
  }

  return newBatch;
}

export async function completePepperBatch(
  orgId: string,
  batchId: string,
  dryBlackPepperKg: number,
  completedDate: string,
  dryStorageSacksCount?: number,
  dryStoragePlasticBagsCount?: number
): Promise<PepperDryingBatch | null> {
  const key = getPepperKey(orgId);
  let updatedBatch: PepperDryingBatch | null = null;

  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const list: PepperDryingBatch[] = JSON.parse(raw);
      const idx = list.findIndex((b) => b.id === batchId);
      if (idx !== -1) {
        const batch = list[idx];
        const recoveryPct = Number(((dryBlackPepperKg / batch.freshSpikesWeightKg) * 100).toFixed(2));
        const variance = Number((recoveryPct - batch.benchmarkOutturnPercentage).toFixed(2));

        batch.dryBlackPepperKg = dryBlackPepperKg;
        batch.completedDate = completedDate;
        batch.recoveryPercentage = recoveryPct;
        batch.varianceFromBenchmark = variance;
        batch.dryStorageSacksCount = dryStorageSacksCount;
        batch.dryStoragePlasticBagsCount = dryStoragePlasticBagsCount;
        batch.status = 'completed';

        updatedBatch = batch;
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
    }
  } catch (err) {
    // continue
  }

  return updatedBatch;
}

// -------------------------------------------------------------
// EXTENSIBLE CROPS LIST
// -------------------------------------------------------------
export async function getAllCrops(orgId: string): Promise<CropConfig[]> {
  const defaultCrops: CropConfig[] = Object.values(CROPS_CONFIG);
  const key = getCropsKey(orgId);

  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const custom: CropConfig[] = JSON.parse(raw);
      const map = new Map<string, CropConfig>();
      defaultCrops.forEach((c) => map.set(c.id, c));
      custom.forEach((c) => map.set(c.id, c));
      return Array.from(map.values());
    }
  } catch {
    // fallback
  }
  return defaultCrops;
}

export async function addCustomCrop(
  orgId: string,
  crop: Omit<CropConfig, 'isCustom'>
): Promise<CropConfig> {
  const newCrop: CropConfig = {
    ...crop,
    isCustom: true,
  };

  const key = getCropsKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    const list: CropConfig[] = raw ? JSON.parse(raw) : [];
    list.push(newCrop);
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch {
    // continue
  }
  return newCrop;
}

// -------------------------------------------------------------
// ESTATE BENCHMARKS
// -------------------------------------------------------------
export async function getEstateBenchmarks(orgId: string): Promise<{
  cardamomOutturnPercentage: number;
  pepperOutturnPercentage: number;
}> {
  const key = getBenchmarksKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // continue
  }
  return DEFAULT_ESTATE_BENCHMARKS;
}

export async function saveEstateBenchmarks(
  orgId: string,
  benchmarks: { cardamomOutturnPercentage: number; pepperOutturnPercentage: number }
): Promise<void> {
  const key = getBenchmarksKey(orgId);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(benchmarks));
  } catch {
    // continue
  }
}

// -------------------------------------------------------------
// YEARLY DRYER PERFORMANCE ENGINE (OWN vs RENTED DRYER)
// -------------------------------------------------------------
export function getAvailableSeasons(curingBatches: CuringBatch[]): string[] {
  const seasons = new Set<string>();
  seasons.add('2026-27');
  for (const b of curingBatches) {
    if (b.seasonYear) seasons.add(b.seasonYear);
  }
  return Array.from(seasons).sort().reverse();
}

export function calculateYearlyDryerComparison(
  curingBatches: CuringBatch[],
  seasonYear: string = '2026-27'
): DryerComparisonSummary {
  const ownBatchesItem: DryerComparisonItem = {
    batchesCount: 0,
    greenKg: 0,
    dryKg: 0,
    averageOutturn: 0,
    runningDays: 0,
  };
  const rentedBatchesItem: DryerComparisonItem = {
    batchesCount: 0,
    greenKg: 0,
    dryKg: 0,
    averageOutturn: 0,
    runningDays: 0,
  };
  const rentedDryerBreakdown: Record<string, DryerComparisonItem> = {};

  const filtered = curingBatches.filter((b) => {
    if (seasonYear !== 'all' && b.seasonYear && b.seasonYear !== seasonYear) return false;
    return b.status === 'completed' || b.status === 'graded';
  });

  for (const batch of filtered) {
    const dryKg = batch.dryWeightKg || 0;
    const greenKg = batch.greenWeightKg || 0;
    const days = batch.runningDays || 1;

    if (batch.dryerType === 'own') {
      ownBatchesItem.batchesCount++;
      ownBatchesItem.greenKg += greenKg;
      ownBatchesItem.dryKg += dryKg;
      ownBatchesItem.runningDays += days;
    } else {
      rentedBatchesItem.batchesCount++;
      rentedBatchesItem.greenKg += greenKg;
      rentedBatchesItem.dryKg += dryKg;
      rentedBatchesItem.runningDays += days;

      const facilityName = batch.dryerName || 'Other Rented Dryer';
      if (!rentedDryerBreakdown[facilityName]) {
        rentedDryerBreakdown[facilityName] = {
          batchesCount: 0,
          greenKg: 0,
          dryKg: 0,
          averageOutturn: 0,
          runningDays: 0,
        };
      }
      rentedDryerBreakdown[facilityName].batchesCount++;
      rentedDryerBreakdown[facilityName].greenKg += greenKg;
      rentedDryerBreakdown[facilityName].dryKg += dryKg;
      rentedDryerBreakdown[facilityName].runningDays += days;
    }
  }

  if (ownBatchesItem.greenKg > 0) {
    ownBatchesItem.averageOutturn = Number(((ownBatchesItem.dryKg / ownBatchesItem.greenKg) * 100).toFixed(2));
  }
  if (rentedBatchesItem.greenKg > 0) {
    rentedBatchesItem.averageOutturn = Number(((rentedBatchesItem.dryKg / rentedBatchesItem.greenKg) * 100).toFixed(2));
  }

  for (const facility in rentedDryerBreakdown) {
    const item = rentedDryerBreakdown[facility];
    if (item.greenKg > 0) {
      item.averageOutturn = Number(((item.dryKg / item.greenKg) * 100).toFixed(2));
    }
  }

  const outturnAdvantage = Number((ownBatchesItem.averageOutturn - rentedBatchesItem.averageOutturn).toFixed(2));

  return {
    seasonYear,
    ownBatches: ownBatchesItem,
    rentedBatches: rentedBatchesItem,
    outturnAdvantage,
    rentedDryerBreakdown,
  };
}

// -------------------------------------------------------------
// HARVEST SUMMARY CALCULATOR
// -------------------------------------------------------------
export function calculateHarvestSummary(
  entries: HarvestEntry[],
  curingBatches: CuringBatch[],
  pepperBatches: PepperDryingBatch[],
  benchmarkOutturn = 20.0,
  seasonYear = '2026-27'
): HarvestSummary {
  let totalCardamomGreenKg = 0;
  let totalPepperFreshKg = 0;
  let totalCoffeeKg = 0;

  for (const entry of entries) {
    const netKg = entry.freshWeightNetKg || entry.totalWeightKg;
    if (entry.cropId === 'cardamom') {
      totalCardamomGreenKg += netKg;
    } else if (entry.cropId === 'pepper') {
      totalPepperFreshKg += netKg;
    } else if (entry.cropId === 'coffee') {
      totalCoffeeKg += netKg;
    }
  }

  let activeCuringBatchesCount = 0;
  let completedCuringBatchesCount = 0;
  let totalDryWeightAll = 0;
  let totalGreenWeightCompleted = 0;

  for (const batch of curingBatches) {
    if (batch.status === 'firing' || batch.status === 'loading') {
      activeCuringBatchesCount++;
    } else if (batch.status === 'completed' || batch.status === 'graded') {
      completedCuringBatchesCount++;
      totalDryWeightAll += batch.dryWeightKg || 0;
      totalGreenWeightCompleted += batch.greenWeightKg || 0;
    }
  }

  const overallAvgOutturn =
    totalGreenWeightCompleted > 0
      ? Number(((totalDryWeightAll / totalGreenWeightCompleted) * 100).toFixed(2))
      : 0;

  let activePepperBatchesCount = 0;
  for (const p of pepperBatches) {
    if (p.status === 'drying') activePepperBatchesCount++;
  }

  const dryerComparison = calculateYearlyDryerComparison(curingBatches, seasonYear);

  return {
    totalCardamomGreenKg: Number(totalCardamomGreenKg.toFixed(1)),
    totalPepperFreshKg: Number(totalPepperFreshKg.toFixed(1)),
    totalCoffeeKg: Number(totalCoffeeKg.toFixed(1)),
    activeCuringBatchesCount,
    completedCuringBatchesCount,
    activePepperBatchesCount,
    averageCuringOutturn: overallAvgOutturn,
    estateBenchmarkOutturn: benchmarkOutturn,
    dryerComparison,
  };
}

// -------------------------------------------------------------
// LABOR CONTRACTOR GROUPS MANAGEMENT (CRUD)
// -------------------------------------------------------------
export async function getContractorGroups(orgId: string): Promise<ContractorGroupConfig[]> {
  const key = getContractorGroupsKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_CONTRACTOR_GROUPS));
  } catch {
    // fallback
  }
  return DEFAULT_CONTRACTOR_GROUPS;
}

export async function addContractorGroup(
  orgId: string,
  name: string,
  isOwnEstate = false,
  notes?: string
): Promise<ContractorGroupConfig> {
  const newGroup: ContractorGroupConfig = {
    id: `cg_${Date.now().toString(36)}`,
    name,
    isOwnEstate,
    notes,
  };
  const key = getContractorGroupsKey(orgId);
  try {
    const groups = await getContractorGroups(orgId);
    groups.push(newGroup);
    await AsyncStorage.setItem(key, JSON.stringify(groups));
  } catch {
    // ignore
  }
  return newGroup;
}

export async function updateContractorGroup(
  orgId: string,
  id: string,
  newName: string
): Promise<void> {
  const key = getContractorGroupsKey(orgId);
  try {
    const groups = await getContractorGroups(orgId);
    const idx = groups.findIndex((g) => g.id === id);
    if (idx !== -1) {
      groups[idx].name = newName;
      await AsyncStorage.setItem(key, JSON.stringify(groups));
    }
  } catch {
    // ignore
  }
}

export async function deleteContractorGroup(orgId: string, id: string): Promise<void> {
  const key = getContractorGroupsKey(orgId);
  try {
    const groups = await getContractorGroups(orgId);
    const filtered = groups.filter((g) => g.id !== id);
    await AsyncStorage.setItem(key, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

// Helper: Calculate total tare weight from packaging items
export function calculatePackagingTare(items?: PackagingItemUsed[]): number {
  if (!items || items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + (item.quantity * item.tarePerUnitKg), 0);
  return Number(sum.toFixed(2));
}

// -------------------------------------------------------------
// CONSOLIDATED SEASON INTELLIGENCE (Executive Plantation View)
// -------------------------------------------------------------
export function calculateConsolidatedIntelligence(
  entries: HarvestEntry[],
  curingBatches: CuringBatch[],
  farmAcreages: Record<FarmId, number> = { namari: 25.0, adukidathan: 30.0, consolidated: 55.0 },
  seasonYear: string = '2026-27'
): ConsolidatedSeasonIntelligence {
  const asOfDate = `${formatDate()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  let totalWorkersDeployed = 0;
  let totalFreshNetKg = 0;
  let totalDryNetKg = 0;

  const farmBreakdown: Record<
    FarmId,
    {
      label: string;
      acreage: number;
      totalWorkers: number;
      totalFreshKg: number;
      totalDryKg: number;
      freshKgPerAcre: number;
      dryKgPerAcre: number;
    }
  > = {
    namari: {
      label: 'Namari Farm',
      acreage: farmAcreages.namari || 25.0,
      totalWorkers: 0,
      totalFreshKg: 0,
      totalDryKg: 0,
      freshKgPerAcre: 0,
      dryKgPerAcre: 0,
    },
    adukidathan: {
      label: 'Adukidathan Farm',
      acreage: farmAcreages.adukidathan || 30.0,
      totalWorkers: 0,
      totalFreshKg: 0,
      totalDryKg: 0,
      freshKgPerAcre: 0,
      dryKgPerAcre: 0,
    },
    consolidated: {
      label: 'Consolidated (All Farms)',
      acreage: (farmAcreages.namari || 25.0) + (farmAcreages.adukidathan || 30.0),
      totalWorkers: 0,
      totalFreshKg: 0,
      totalDryKg: 0,
      freshKgPerAcre: 0,
      dryKgPerAcre: 0,
    },
  };

  const contractorBreakdown: Record<
    string,
    {
      groupName: string;
      isOwnEstate: boolean;
      totalWorkers: number;
      totalFreshKg: number;
      totalDryKg: number;
      freshKgPerWorker: number;
      dryKgPerWorker: number;
    }
  > = {};

  const flushesBreakdown: Record<
    string,
    {
      namariFreshKg: number;
      adukidathanFreshKg: number;
      totalFreshKg: number;
      totalDryKg: number;
      totalWorkers: number;
    }
  > = {};

  for (const entry of entries) {
    const fId = entry.farmId as FarmId;
    const freshNet = entry.freshWeightNetKg || entry.totalWeightKg || 0;
    const dryNet = entry.dryWeightNetKg || (freshNet > 0 ? freshNet * 0.21 : 0);
    const workers = entry.workerCount || 0;

    totalWorkersDeployed += workers;
    totalFreshNetKg += freshNet;
    totalDryNetKg += dryNet;

    if (farmBreakdown[fId]) {
      farmBreakdown[fId].totalWorkers += workers;
      farmBreakdown[fId].totalFreshKg += freshNet;
      farmBreakdown[fId].totalDryKg += dryNet;
    }
    farmBreakdown.consolidated.totalWorkers += workers;
    farmBreakdown.consolidated.totalFreshKg += freshNet;
    farmBreakdown.consolidated.totalDryKg += dryNet;

    // Contractor groups output
    if (entry.laborGroups && entry.laborGroups.length > 0) {
      for (const lg of entry.laborGroups) {
        const gKey = lg.groupName || 'Own Estate workers';
        if (!contractorBreakdown[gKey]) {
          const isOwn = gKey.toLowerCase().includes('own estate');
          contractorBreakdown[gKey] = {
            groupName: gKey,
            isOwnEstate: isOwn,
            totalWorkers: 0,
            totalFreshKg: 0,
            totalDryKg: 0,
            freshKgPerWorker: 0,
            dryKgPerWorker: 0,
          };
        }
        contractorBreakdown[gKey].totalWorkers += lg.workerCount || 0;
        contractorBreakdown[gKey].totalFreshKg += lg.totalWeightKg || 0;
        const dryPortion = lg.totalWeightKg ? lg.totalWeightKg * 0.21 : 0;
        contractorBreakdown[gKey].totalDryKg += dryPortion;
      }
    }

    // Flush breakdown
    if (entry.flushNumber) {
      const fl = entry.flushNumber;
      if (!flushesBreakdown[fl]) {
        flushesBreakdown[fl] = {
          namariFreshKg: 0,
          adukidathanFreshKg: 0,
          totalFreshKg: 0,
          totalDryKg: 0,
          totalWorkers: 0,
        };
      }
      if (fId === 'namari') {
        flushesBreakdown[fl].namariFreshKg += freshNet;
      } else if (fId === 'adukidathan') {
        flushesBreakdown[fl].adukidathanFreshKg += freshNet;
      }
      flushesBreakdown[fl].totalFreshKg += freshNet;
      flushesBreakdown[fl].totalDryKg += dryNet;
      flushesBreakdown[fl].totalWorkers += workers;
    }
  }

  // Calculate per acre yields
  for (const fId of ['namari', 'adukidathan', 'consolidated'] as FarmId[]) {
    const f = farmBreakdown[fId];
    if (f.acreage > 0) {
      f.freshKgPerAcre = Number((f.totalFreshKg / f.acreage).toFixed(1));
      f.dryKgPerAcre = Number((f.totalDryKg / f.acreage).toFixed(1));
    }
    f.totalFreshKg = Number(f.totalFreshKg.toFixed(1));
    f.totalDryKg = Number(f.totalDryKg.toFixed(1));
  }

  // Calculate contractor per-worker output
  for (const gKey in contractorBreakdown) {
    const cg = contractorBreakdown[gKey];
    if (cg.totalWorkers > 0) {
      cg.freshKgPerWorker = Number((cg.totalFreshKg / cg.totalWorkers).toFixed(1));
      cg.dryKgPerWorker = Number((cg.totalDryKg / cg.totalWorkers).toFixed(1));
    }
    cg.totalFreshKg = Number(cg.totalFreshKg.toFixed(1));
    cg.totalDryKg = Number(cg.totalDryKg.toFixed(1));
  }

  // Aggregate Fuel & Dryer metrics
  const totalFuelConsumed: FuelConsumption = {
    firewoodBundles: 0,
    dieselLiters: 0,
    petrolLiters: 0,
    engineOilLiters: 0,
  };

  let ownRunningDays = 0;
  let rentedRunningDays = 0;
  let ownBatchesCount = 0;
  let rentedBatchesCount = 0;
  let ownGreenKg = 0;
  let ownDryKg = 0;
  let rentedGreenKg = 0;
  let rentedDryKg = 0;

  for (const b of curingBatches) {
    if (seasonYear !== 'all' && b.seasonYear && b.seasonYear !== seasonYear) continue;

    const days = b.runningDays || 1;
    if (b.dryerType === 'own') {
      ownRunningDays += days;
      ownBatchesCount++;
      ownGreenKg += b.greenWeightKg || 0;
      ownDryKg += b.dryWeightKg || 0;
    } else {
      rentedRunningDays += days;
      rentedBatchesCount++;
      rentedGreenKg += b.greenWeightKg || 0;
      rentedDryKg += b.dryWeightKg || 0;
    }

    if (b.fuelConsumed) {
      totalFuelConsumed.firewoodBundles += b.fuelConsumed.firewoodBundles || 0;
      totalFuelConsumed.dieselLiters += b.fuelConsumed.dieselLiters || 0;
      totalFuelConsumed.petrolLiters += b.fuelConsumed.petrolLiters || 0;
      totalFuelConsumed.engineOilLiters += b.fuelConsumed.engineOilLiters || 0;
    } else if (b.totalFirewoodConsumed) {
      totalFuelConsumed.firewoodBundles += b.totalFirewoodConsumed;
    }
  }

  const ownAvgOutturn = ownGreenKg > 0 ? Number(((ownDryKg / ownGreenKg) * 100).toFixed(2)) : 0;
  const rentedAvgOutturn = rentedGreenKg > 0 ? Number(((rentedDryKg / rentedGreenKg) * 100).toFixed(2)) : 0;
  const outturnAdvantage = Number((ownAvgOutturn - rentedAvgOutturn).toFixed(2));

  const averageOutturnPercentage =
    totalFreshNetKg > 0 ? Number(((totalDryNetKg / totalFreshNetKg) * 100).toFixed(2)) : 20.0;

  return {
    seasonYear,
    asOfDate,
    totalWorkersDeployed,
    totalFreshNetKg: Number(totalFreshNetKg.toFixed(1)),
    totalDryNetKg: Number(totalDryNetKg.toFixed(1)),
    averageOutturnPercentage,
    farmBreakdown,
    contractorBreakdown,
    dryerIntelligence: {
      ownRunningDays,
      rentedRunningDays,
      ownBatchesCount,
      rentedBatchesCount,
      ownAvgOutturn,
      rentedAvgOutturn,
      outturnAdvantage,
    },
    totalFuelConsumed,
    flushesBreakdown,
  };
}

// -------------------------------------------------------------
// COFFEE VARIETIES MANAGEMENT (Custom & Standard)
// -------------------------------------------------------------
const DEFAULT_COFFEE_VARIETIES = [
  'Arabica - S.795',
  'Arabica - Chandragiri',
  'Arabica - Selection 9',
  'Arabica - Cauvery',
  'Robusta - S.274',
  'Robusta - CxR',
  'Old Robusta',
];

function getCoffeeVarietiesKey(orgId: string): string {
  return `@plantation_coffee_varieties_${orgId}`;
}

export async function getCoffeeVarieties(orgId: string): Promise<string[]> {
  const key = getCoffeeVarietiesKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_COFFEE_VARIETIES));
  } catch {
    // ignore
  }
  return DEFAULT_COFFEE_VARIETIES;
}

export async function addCoffeeVariety(orgId: string, variety: string): Promise<string[]> {
  const trimmed = variety.trim();
  if (!trimmed) return getCoffeeVarieties(orgId);
  const key = getCoffeeVarietiesKey(orgId);
  try {
    const list = await getCoffeeVarieties(orgId);
    if (!list.includes(trimmed)) {
      const updated = [...list, trimmed];
      await AsyncStorage.setItem(key, JSON.stringify(updated));
      return updated;
    }
    return list;
  } catch {
    return DEFAULT_COFFEE_VARIETIES;
  }
}

// -------------------------------------------------------------
// CARDAMOM FLUSHES MANAGEMENT (Custom & Standard)
// -------------------------------------------------------------
export const DEFAULT_CARDAMOM_FLUSHES = [
  '1st Flush',
  '2nd Flush',
  '3rd Flush',
  '4th Flush',
];

function getCardamomFlushesKey(orgId: string): string {
  return `@plantation_cardamom_flushes_${orgId}`;
}

export async function getCardamomFlushes(orgId: string): Promise<string[]> {
  const key = getCardamomFlushesKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_CARDAMOM_FLUSHES));
  } catch {
    // ignore
  }
  return DEFAULT_CARDAMOM_FLUSHES;
}

export async function addCardamomFlush(orgId: string, flushName: string): Promise<string[]> {
  const trimmed = flushName.trim();
  if (!trimmed) return getCardamomFlushes(orgId);
  const key = getCardamomFlushesKey(orgId);
  try {
    const list = await getCardamomFlushes(orgId);
    if (!list.includes(trimmed)) {
      const updated = [...list, trimmed];
      await AsyncStorage.setItem(key, JSON.stringify(updated));
      return updated;
    }
    return list;
  } catch {
    return DEFAULT_CARDAMOM_FLUSHES;
  }
}

