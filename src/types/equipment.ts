export type ExpendableType = 'fuel' | 'oil' | 'wood' | 'chemical' | 'fertilizer' | 'other';

export interface ExpendableItem {
  id: string;
  orgId: string;
  name: string;
  type: ExpendableType;
  unit: string; // 'Litres', 'bundles', 'bags', 'kg', etc.
  currentStock: number;
  reorderLevel?: number;
  lastRestockedDate?: string;
  isCustom?: boolean;
}

export interface ConsumptionEntry {
  id: string;
  orgId: string;
  date: string; // DD-MMM-YYYY
  itemId: string; // ID of expendable item (e.g. petrol, diesel, engine_oil, wood)
  itemName: string;
  machineId: string; // ID of equipment/machine where consumed
  machineName: string;
  quantityConsumed: number;
  remainingStock: number;
  operatorName?: string;
  purpose?: string;
  createdAt: string;
}

export type EquipmentCategory =
  | 'dryerBlower'
  | 'generator'
  | 'brushCutter'
  | 'sprayer'
  | 'tractor'
  | 'pump'
  | 'chainsaw'
  | 'other';

export type EquipmentStatus = 'operational' | 'needsService' | 'breakdown';

export interface FarmEquipment {
  id: string;
  orgId: string;
  name: string;
  assetId: string; // e.g. "EQ-GEN-01"
  category: EquipmentCategory;
  makeModel?: string; // e.g. "Kirloskar 10kVA"
  purchaseDate: string; // DD-MMM-YYYY or YYYY-MM-DD
  purchaseCost?: number; // ₹
  expectedLifeYears: number; // e.g. 5, 8, 10
  status: EquipmentStatus;
  cumulativeFuelConsumed?: number; // Total Litres consumed over lifetime
  runningHoursEstimate?: number;
  notes?: string;
  assignedFarmId?: string; // Farm where machine is based
}

export type MusterFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface EquipmentMusterItem {
  equipmentId: string;
  equipmentName: string;
  isPresent: boolean;
  condition: EquipmentStatus;
  operatorAssigned?: string;
  remarks?: string;
}

export interface EquipmentMuster {
  id: string;
  orgId: string;
  auditDate: string; // DD-MMM-YYYY
  frequency: MusterFrequency;
  auditedBy: string;
  items: EquipmentMusterItem[];
  totalEquipmentCount: number;
  operationalCount: number;
  serviceNeededCount: number;
  missingCount: number;
  notes?: string;
  createdAt: string;
}
