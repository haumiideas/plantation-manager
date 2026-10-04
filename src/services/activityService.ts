import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FieldActivityEntry,
  StandardTaskType,
  DEFAULT_TASK_ACTIVITIES,
} from '../types/activity';
import { FarmId } from '../types/farm';
import { logConsumption } from './equipmentService';
import { executeCloudWriteOrQueue } from './syncQueueService';

const ACTIVITIES_COLLECTION = 'field_activities';

function getActivitiesKey(orgId: string): string {
  return `@plantation_activity_entries_${orgId}`;
}

function getTaskActivitiesKey(orgId: string): string {
  return `@plantation_task_type_activities_${orgId}`;
}

const INITIAL_ACTIVITIES: FieldActivityEntry[] = [
  {
    id: 'ACT-2026-09-01',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'namari',
    date: '20-Sep-2026',
    cropId: 'cardamom',
    blockName: 'Ridge Block A',
    taskType: 'spraying',
    activityName: '1% Bordeaux mixture prophylactic spray',
    workersAssigned: 4,
    hoursWorked: 6,
    chemicalUsed: 'Copper Sulfate + Slaked Lime (1%)',
    dilutionLitres: 450,
    costIncurred: 1800,
    notes: 'Covered southern slopes ahead of evening showers. Good foliage adherence.',
    createdAt: '2026-09-20T08:00:00.000Z',
  },
  {
    id: 'ACT-2026-09-02',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'adukidathan',
    date: '19-Sep-2026',
    cropId: 'coffee',
    blockName: 'Valley Block B',
    taskType: 'weeding',
    activityName: 'Ring weeding coffee plants',
    workersAssigned: 6,
    hoursWorked: 8,
    costIncurred: 2700,
    notes: 'Clean 1m diameter ring around Arabica plants completed.',
    createdAt: '2026-09-19T07:30:00.000Z',
  },
  {
    id: 'ACT-2026-09-03',
    orgId: 'plantation_org_namari_adukidathan',
    farmId: 'namari',
    date: '18-Sep-2026',
    cropId: 'pepper',
    blockName: 'Block 1 (Intercropped)',
    taskType: 'pruning',
    activityName: 'Pepper runner shoots trimming',
    workersAssigned: 3,
    hoursWorked: 7,
    notes: 'Trimmed bottom trailing shoots to channel vigor to climbing vines.',
    createdAt: '2026-09-18T08:00:00.000Z',
  },
];

// -------------------------------------------------------------
// TASK TYPE ACTIVITIES (Pre-configured & Custom additions)
// -------------------------------------------------------------
export async function getTaskTypeActivities(
  orgId: string
): Promise<Record<StandardTaskType, string[]>> {
  const key = getTaskActivitiesKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_TASK_ACTIVITIES, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_TASK_ACTIVITIES;
}

export async function addActivityToTaskType(
  orgId: string,
  taskType: StandardTaskType,
  newActivity: string
): Promise<Record<StandardTaskType, string[]>> {
  const trimmed = newActivity.trim();
  if (!trimmed) return getTaskTypeActivities(orgId);

  const current = await getTaskTypeActivities(orgId);
  const existingList = current[taskType] || [];

  if (!existingList.includes(trimmed)) {
    const updated = {
      ...current,
      [taskType]: [...existingList, trimmed],
    };
    const key = getTaskActivitiesKey(orgId);
    try {
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  }
  return current;
}

export async function deleteActivityFromTaskType(
  orgId: string,
  taskType: StandardTaskType,
  activityName: string
): Promise<Record<StandardTaskType, string[]>> {
  const current = await getTaskTypeActivities(orgId);
  const existingList = current[taskType] || [];
  const updated = {
    ...current,
    [taskType]: existingList.filter((a) => a !== activityName),
  };
  const key = getTaskActivitiesKey(orgId);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

// -------------------------------------------------------------
// FIELD ACTIVITY ENTRIES CRUD
// -------------------------------------------------------------
export async function getActivityEntries(
  orgId: string,
  farmId?: FarmId
): Promise<FieldActivityEntry[]> {
  const key = getActivitiesKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    let entries: FieldActivityEntry[] = [];
    if (raw) {
      entries = JSON.parse(raw);
    } else {
      entries = INITIAL_ACTIVITIES;
      await AsyncStorage.setItem(key, JSON.stringify(entries));
    }

    if (farmId && farmId !== 'consolidated') {
      return entries.filter((e) => e.farmId === farmId);
    }
    return entries;
  } catch {
    return INITIAL_ACTIVITIES;
  }
}

const CUSTOM_FERT_METHODS_KEY = '@farmag_custom_fert_methods';

export async function getCustomFertigationMethods(orgId?: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_FERT_METHODS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return ['Root Basal Jet', 'Venturi Line Feed'];
}

export async function addCustomFertigationMethod(
  method: string,
  orgId?: string
): Promise<string[]> {
  const trimmed = method.trim();
  if (!trimmed) return getCustomFertigationMethods(orgId);
  try {
    const current = await getCustomFertigationMethods(orgId);
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      await AsyncStorage.setItem(CUSTOM_FERT_METHODS_KEY, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch {
    return [trimmed];
  }
}

export async function saveActivityEntry(
  entry: Omit<FieldActivityEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<FieldActivityEntry> {
  const isEdit = !!entry.id;
  const id = entry.id || `ACT-${Date.now().toString(36).toUpperCase()}`;
  const createdAt = entry.createdAt || new Date().toISOString();
  const savedEntry: FieldActivityEntry = {
    ...entry,
    id,
    createdAt,
    updatedAt: isEdit ? new Date().toISOString() : undefined,
  };

  // Auto-log fuel consumption to inventory & machinery log if fertigation used motor with fuel
  if (
    entry.fertigation &&
    (entry.fertigation.mode === 'petrol_motor' || entry.fertigation.mode === 'diesel_motor') &&
    entry.fertigation.fuelConsumedLitres &&
    entry.fertigation.fuelConsumedLitres > 0 &&
    !entry.fertigation.fuelLogged
  ) {
    try {
      const isPetrol = entry.fertigation.mode === 'petrol_motor';
      await logConsumption(entry.orgId, {
        date: entry.date,
        itemId: isPetrol ? 'exp_petrol' : 'exp_diesel',
        machineId: entry.fertigation.motorEquipmentId || (isPetrol ? 'eq_spray_01' : 'eq_gen_01'),
        quantityConsumed: entry.fertigation.fuelConsumedLitres,
        operatorName: `${entry.workersAssigned} workers team`,
        purpose: `Fertigation (${entry.fertigation.method}) in ${entry.blockName} - ${entry.fertigation.drumsCount} drums (${entry.fertigation.totalSolutionLitres}L)`,
      });
      savedEntry.fertigation = {
        ...entry.fertigation,
        fuelLogged: true,
      };
    } catch (fuelErr) {
      console.warn('Auto fuel logging failed for fertigation:', fuelErr);
    }
  }

  const key = getActivitiesKey(entry.orgId);
  try {
    const entries = await getActivityEntries(entry.orgId);
    let updated: FieldActivityEntry[];
    if (isEdit) {
      updated = entries.map((e) => (e.id === id ? savedEntry : e));
    } else {
      updated = [savedEntry, ...entries];
    }
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // ignore
  }

  await executeCloudWriteOrQueue(ACTIVITIES_COLLECTION, savedEntry.id, 'set', savedEntry);

  return savedEntry;
}

export async function deleteActivityEntry(
  orgId: string,
  id: string
): Promise<void> {
  const key = getActivitiesKey(orgId);
  try {
    const entries = await getActivityEntries(orgId);
    const filtered = entries.filter((e) => e.id !== id);
    await AsyncStorage.setItem(key, JSON.stringify(filtered));
  } catch {
    // ignore
  }

  await executeCloudWriteOrQueue(ACTIVITIES_COLLECTION, id, 'delete');
}
