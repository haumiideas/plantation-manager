import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExpendableItem,
  ConsumptionEntry,
  FarmEquipment,
  EquipmentMuster,
} from '../types/equipment';
import { formatDate, parseEstateDate } from '../utils/date';

function getExpendablesKey(orgId: string): string {
  return `@plantation_expendables_${orgId}`;
}

function getConsumptionKey(orgId: string): string {
  return `@plantation_consumption_${orgId}`;
}

function getEquipmentKey(orgId: string): string {
  return `@plantation_equipment_${orgId}`;
}

function getMusterKey(orgId: string): string {
  return `@plantation_muster_${orgId}`;
}

// Default initial expendables
const DEFAULT_EXPENDABLES: ExpendableItem[] = [
  {
    id: 'exp_petrol',
    orgId: 'default',
    name: 'Petrol',
    type: 'fuel',
    unit: 'Litres',
    currentStock: 45,
    reorderLevel: 15,
  },
  {
    id: 'exp_diesel',
    orgId: 'default',
    name: 'Diesel',
    type: 'fuel',
    unit: 'Litres',
    currentStock: 120,
    reorderLevel: 40,
  },
  {
    id: 'exp_engine_oil',
    orgId: 'default',
    name: 'Engine Oil',
    type: 'oil',
    unit: 'Litres',
    currentStock: 14,
    reorderLevel: 5,
  },
  {
    id: 'exp_firewood',
    orgId: 'default',
    name: 'Wooden Logs (Firewood)',
    type: 'wood',
    unit: 'bundles',
    currentStock: 65,
    reorderLevel: 20,
  },
];

// Default initial estate equipment
const DEFAULT_EQUIPMENT: FarmEquipment[] = [
  {
    id: 'eq_gen_01',
    orgId: 'default',
    name: 'Dryer & Lighting Generator',
    assetId: 'EQ-GEN-01',
    category: 'generator',
    makeModel: 'Kirloskar 10 kVA Diesel',
    purchaseDate: '15-Aug-2023',
    purchaseCost: 85000,
    expectedLifeYears: 8,
    status: 'operational',
    cumulativeFuelConsumed: 480,
    runningHoursEstimate: 320,
    notes: 'Powers dryer blower & primary estate quarters.',
  },
  {
    id: 'eq_blower_01',
    orgId: 'default',
    name: 'Cardamom Dryer Hot Air Blower',
    assetId: 'EQ-BLW-01',
    category: 'dryerBlower',
    makeModel: 'Estate Engineered 3HP Centrifugal',
    purchaseDate: '10-Jun-2022',
    purchaseCost: 45000,
    expectedLifeYears: 10,
    status: 'operational',
    cumulativeFuelConsumed: 620,
    runningHoursEstimate: 740,
    notes: 'Primary cardamom curing chamber air circulation.',
  },
  {
    id: 'eq_brush_01',
    orgId: 'default',
    name: 'Power Weeder / Brush Cutter #1',
    assetId: 'EQ-WEED-01',
    category: 'brushCutter',
    makeModel: 'Stihl FS 120 2-Stroke',
    purchaseDate: '20-Nov-2024',
    purchaseCost: 28000,
    expectedLifeYears: 4,
    status: 'operational',
    cumulativeFuelConsumed: 85,
    runningHoursEstimate: 140,
    notes: 'Cardamom inter-row weed clearance.',
  },
  {
    id: 'eq_spray_01',
    orgId: 'default',
    name: 'HTP Power Sprayer Trolley',
    assetId: 'EQ-SPRAY-01',
    category: 'sprayer',
    makeModel: 'Aspee 4-Stroke Petrol HTP',
    purchaseDate: '05-Mar-2024',
    purchaseCost: 34000,
    expectedLifeYears: 6,
    status: 'operational',
    cumulativeFuelConsumed: 60,
    runningHoursEstimate: 95,
    notes: 'Bordeaux & pesticide spraying across slopes.',
  },
  {
    id: 'eq_pump_01',
    orgId: 'default',
    name: 'Stream Irrigation Diesel Pump',
    assetId: 'EQ-PUMP-01',
    category: 'pump',
    makeModel: 'FieldMarshal 5HP Water Pump',
    purchaseDate: '12-Jan-2023',
    purchaseCost: 32000,
    expectedLifeYears: 7,
    status: 'needsService',
    cumulativeFuelConsumed: 290,
    runningHoursEstimate: 210,
    notes: 'Impeller seal requires routine service before summer.',
  },
];

// Initial consumption logs
const DEFAULT_CONSUMPTION: ConsumptionEntry[] = [
  {
    id: 'cns_01',
    orgId: 'default',
    date: '20-Sep-2026',
    itemId: 'exp_diesel',
    itemName: 'Diesel',
    machineId: 'eq_gen_01',
    machineName: 'Dryer & Lighting Generator',
    quantityConsumed: 12,
    remainingStock: 120,
    operatorName: 'Murugan (Driver)',
    purpose: 'Cardamom 1st flush night curing firing cycle',
    createdAt: '2026-09-20T21:00:00.000Z',
  },
  {
    id: 'cns_02',
    orgId: 'default',
    date: '19-Sep-2026',
    itemId: 'exp_petrol',
    itemName: 'Petrol',
    machineId: 'eq_brush_01',
    machineName: 'Power Weeder / Brush Cutter #1',
    quantityConsumed: 3.5,
    remainingStock: 45,
    operatorName: 'Ramu',
    purpose: 'Inter-row weeding in Ridge Block A',
    createdAt: '2026-09-19T10:30:00.000Z',
  },
  {
    id: 'cns_03',
    orgId: 'default',
    date: '18-Sep-2026',
    itemId: 'exp_engine_oil',
    itemName: 'Engine Oil',
    machineId: 'eq_gen_01',
    machineName: 'Dryer & Lighting Generator',
    quantityConsumed: 1.5,
    remainingStock: 14,
    operatorName: 'Murugan',
    purpose: 'Periodic 100-hour oil replacement',
    createdAt: '2026-09-18T14:00:00.000Z',
  },
];

// --- EXPENDABLES INVENTORY ---

export async function getExpendableItems(orgId: string): Promise<ExpendableItem[]> {
  const key = getExpendablesKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const seeded = DEFAULT_EXPENDABLES.map((it) => ({ ...it, orgId }));
  await AsyncStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
}

export async function saveExpendableItem(
  orgId: string,
  item: ExpendableItem
): Promise<ExpendableItem[]> {
  const items = await getExpendableItems(orgId);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  await AsyncStorage.setItem(getExpendablesKey(orgId), JSON.stringify(items));
  return items;
}

export async function addStockToExpendable(
  orgId: string,
  itemNameOrType: string,
  quantity: number,
  unit?: string
): Promise<ExpendableItem | null> {
  const items = await getExpendableItems(orgId);
  const normalized = itemNameOrType.toLowerCase().trim();

  let target = items.find(
    (i) =>
      i.name.toLowerCase() === normalized ||
      i.type.toLowerCase() === normalized ||
      (normalized.includes('petrol') && i.name.toLowerCase().includes('petrol')) ||
      (normalized.includes('diesel') && i.name.toLowerCase().includes('diesel')) ||
      (normalized.includes('oil') && i.name.toLowerCase().includes('oil')) ||
      (normalized.includes('wood') && i.name.toLowerCase().includes('wood'))
  );

  if (target) {
    target.currentStock = Math.max(0, target.currentStock + quantity);
    target.lastRestockedDate = formatDate();
    if (unit && !target.unit) target.unit = unit;
    await AsyncStorage.setItem(getExpendablesKey(orgId), JSON.stringify(items));
    return target;
  }
  return null;
}

// --- CONSUMPTION LOGS ---

export async function getConsumptionEntries(orgId: string): Promise<ConsumptionEntry[]> {
  const key = getConsumptionKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const seeded = DEFAULT_CONSUMPTION.map((c) => ({ ...c, orgId }));
  await AsyncStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
}

export async function logConsumption(
  orgId: string,
  entryData: {
    date: string;
    itemId: string;
    machineId: string;
    quantityConsumed: number;
    operatorName?: string;
    purpose?: string;
  }
): Promise<{ success: boolean; entry?: ConsumptionEntry; error?: string }> {
  const items = await getExpendableItems(orgId);
  const item = items.find((i) => i.id === entryData.itemId);
  if (!item) {
    return { success: false, error: 'Expendable item not found' };
  }

  const equipmentList = await getFarmEquipment(orgId);
  const machine = equipmentList.find((m) => m.id === entryData.machineId);
  const machineName = machine ? machine.name : 'General Machine';

  // Deduct stock
  item.currentStock = Math.max(0, item.currentStock - entryData.quantityConsumed);
  await AsyncStorage.setItem(getExpendablesKey(orgId), JSON.stringify(items));

  // Update cumulative consumption on machine
  if (machine) {
    machine.cumulativeFuelConsumed =
      (machine.cumulativeFuelConsumed || 0) + entryData.quantityConsumed;
    await saveEquipment(orgId, machine);
  }

  const newEntry: ConsumptionEntry = {
    id: `cns_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    orgId,
    date: entryData.date || formatDate(),
    itemId: item.id,
    itemName: item.name,
    machineId: entryData.machineId,
    machineName,
    quantityConsumed: entryData.quantityConsumed,
    remainingStock: item.currentStock,
    operatorName: entryData.operatorName,
    purpose: entryData.purpose,
    createdAt: new Date().toISOString(),
  };

  const logs = await getConsumptionEntries(orgId);
  logs.unshift(newEntry);
  await AsyncStorage.setItem(getConsumptionKey(orgId), JSON.stringify(logs));

  return { success: true, entry: newEntry };
}

export async function deleteConsumptionEntry(
  orgId: string,
  id: string
): Promise<ConsumptionEntry[]> {
  const logs = await getConsumptionEntries(orgId);
  const filtered = logs.filter((l) => l.id !== id);
  await AsyncStorage.setItem(getConsumptionKey(orgId), JSON.stringify(filtered));
  return filtered;
}

// --- FARM EQUIPMENT REGISTRY & OVER-USAGE ANALYSIS ---

export async function getFarmEquipment(orgId: string): Promise<FarmEquipment[]> {
  const key = getEquipmentKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const seeded = DEFAULT_EQUIPMENT.map((eq) => ({ ...eq, orgId }));
  await AsyncStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
}

export async function saveEquipment(
  orgId: string,
  equipment: FarmEquipment
): Promise<FarmEquipment[]> {
  const list = await getFarmEquipment(orgId);
  const idx = list.findIndex((e) => e.id === equipment.id);
  if (idx >= 0) {
    list[idx] = equipment;
  } else {
    list.push(equipment);
  }
  await AsyncStorage.setItem(getEquipmentKey(orgId), JSON.stringify(list));
  return list;
}

export async function deleteEquipment(orgId: string, id: string): Promise<FarmEquipment[]> {
  const list = await getFarmEquipment(orgId);
  const filtered = list.filter((e) => e.id !== id);
  await AsyncStorage.setItem(getEquipmentKey(orgId), JSON.stringify(filtered));
  return filtered;
}

export interface EquipmentLifeAnalysis {
  equipment: FarmEquipment;
  ageDays: number;
  ageYears: number;
  remainingLifeYears: number;
  isOverUsage: boolean;
  overUsageWarning?: string;
}

export function analyzeEquipmentLife(equipment: FarmEquipment): EquipmentLifeAnalysis {
  let purchase = parseEstateDate(equipment.purchaseDate);
  if (!purchase || isNaN(purchase.getTime())) {
    purchase = new Date(equipment.purchaseDate);
  }
  const now = new Date();
  const validPurchaseTime = !isNaN(purchase.getTime())
    ? purchase.getTime()
    : now.getTime() - 365.25 * 24 * 3600 * 1000 * 1.5;
  const diffTime = Math.max(0, now.getTime() - validPurchaseTime);
  const ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  let ageYears = parseFloat((ageDays / 365.25).toFixed(1));
  if (isNaN(ageYears) || ageYears < 0) ageYears = 1.0;
  const remainingLifeYears = Math.max(0, parseFloat((equipment.expectedLifeYears - ageYears).toFixed(1)));

  // Over-usage heuristics:
  // 1. If cumulative fuel burn exceeds 150 Litres/year of life
  // 2. If running hours exceed expected threshold
  // 3. If age exceeds expectedLifeYears
  let isOverUsage = false;
  let overUsageWarning: string | undefined;

  const annualFuelRate = ageYears > 0 ? (equipment.cumulativeFuelConsumed || 0) / ageYears : (equipment.cumulativeFuelConsumed || 0);

  if (ageYears >= equipment.expectedLifeYears) {
    isOverUsage = true;
    overUsageWarning = 'Equipment has exceeded expected service life. High maintenance risk.';
  } else if (annualFuelRate > 250) {
    isOverUsage = true;
    overUsageWarning = `High fuel consumption rate (~${annualFuelRate.toFixed(0)} L/yr). Inspect engine tuning or overhaul.`;
  } else if (equipment.status === 'needsService') {
    overUsageWarning = 'Scheduled servicing overdue. Continued operation risks breakdown.';
  }

  return {
    equipment,
    ageDays,
    ageYears,
    remainingLifeYears,
    isOverUsage,
    overUsageWarning,
  };
}

// --- EQUIPMENT MUSTER AUDITS ---

export async function getEquipmentMusters(orgId: string): Promise<EquipmentMuster[]> {
  const key = getMusterKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

export async function saveEquipmentMuster(
  orgId: string,
  muster: EquipmentMuster
): Promise<EquipmentMuster[]> {
  const list = await getEquipmentMusters(orgId);
  list.unshift(muster);
  await AsyncStorage.setItem(getMusterKey(orgId), JSON.stringify(list));
  return list;
}
