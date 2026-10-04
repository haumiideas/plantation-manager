import { CropType } from './crop';
import { FarmId } from './farm';

export type DryerType = 'own' | 'rented';

export type HarvestEntryMode = 'bulk' | 'picker_breakdown' | 'labor_gang';

// Configurable Packaging Materials & Tare Weights
export interface PackagingItemUsed {
  id: string;
  name: string; // Customizable: e.g. "Fresh PP Picking Sack", "Gunny Bag", "Plastic Liner Bag"
  quantity: number;
  tarePerUnitKg: number; // Configurable: e.g. 0.2 kg for fresh sacks, 1.1 kg for gunny, 0.1 kg for plastic
  totalTareKg: number; // quantity * tarePerUnitKg
}

// Editable Labor Contractor Group
export interface ContractorGroupConfig {
  id: string;
  name: string; // Editable: e.g. "Own Estate workers", "Boopathi workers", "Thangamani workers"
  isOwnEstate: boolean;
  notes?: string;
}

export interface LaborGroupOutput {
  id: string;
  groupId: string;
  groupName: string; // e.g. "Own Estate workers", "Boopathi workers"
  groupType?: string;
  workerCount: number;
  totalWeightKg: number;
  kgPerPersonPerDay: number; // Auto-calculated: totalWeightKg / workerCount
}

export type LaborGroupEntry = LaborGroupOutput;

// Picker weighment WITHOUT incentive (User confirmed: no incentive for any picker)
export interface PickerWeighment {
  workerId: string;
  workerName: string;
  weightKg: number;
  incentiveAmount?: number; // Kept optional for backward compatibility
}

export interface HarvestEntry {
  id: string;
  orgId: string;
  farmId: FarmId;
  date: string; // Formatted 'DD-MMM-YYYY'
  dayOfWeek: string; // e.g. 'Sunday', 'Monday'
  cropId: CropType | string;
  cropName: string;
  variety?: string; // e.g. 'Arabica - Chandragiri', 'Robusta - S.274', 'Njallani'
  blockName: string;
  entryMode: HarvestEntryMode;
  workerCount: number;

  // Configurable Fresh Packaging & Tare
  freshPackagingItems?: PackagingItemUsed[];
  totalFreshTareKg?: number; // Sum of tare for all sacks
  freshSacksCount?: number;
  sackTareWeightKg?: number;
  freshWeightGrossKg: number; // Weight with sack
  freshWeightNetKg: number; // Gross - Tare (totalWeightKg)
  totalWeightKg: number; // Alias for net weight

  // Cardamom Flush tracking & locking
  flushNumber?: string; // '1st Flush', '2nd Flush', '3rd Flush', '4th Flush'
  isFlushLocked?: boolean;

  // Configurable Dry Produce & Packaging Tare
  dryPackagingItems?: PackagingItemUsed[];
  totalDryTareKg?: number;
  dryStorageSacksCount?: number;
  dryStoragePlasticBagsCount?: number;
  dryWeightGrossKg?: number;
  dryWeightNetKg?: number; // Gross - Tare (Gunny 1.1kg + Plastic 0.1kg configurable)
  freshToDryRatio?: number; // Fresh Net / Dry Net

  // Editable Labor Groups
  laborGroups?: LaborGroupOutput[];

  // Individual Pickers
  pickerEntries?: PickerWeighment[];

  qualityNotes?: string; // Manual supervisor observations only
  recordedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FiringLogEntry {
  id: string;
  timestamp: string; // 'DD-MMM-YYYY HH:mm'
  tempCelsius: number;
  firewoodBundles: number;
  notes?: string;
}

export interface CardamomGrading {
  grade8mmPlusKg: number;
  grade7to8mmKg: number;
  gradeSplitsKg: number;
  gradeHuskSeedsKg: number;
  gradedDate?: string;
}

export type CuringBatchStatus = 'loading' | 'firing' | 'completed' | 'graded';

// Fuel consumption tracking for curing operations
export interface FuelConsumption {
  firewoodBundles: number;
  dieselLiters: number;
  petrolLiters: number;
  engineOilLiters: number;
}

export interface CuringBatch {
  id: string; // e.g. 'CUR-2026-09-01'
  orgId: string;
  farmId: FarmId;
  status: CuringBatchStatus;
  seasonYear: string; // e.g. '2026-27', '2025-26'
  
  // Dryer Location & Ownership (Editable Dryer Name)
  dryerType: DryerType; // 'own' or 'rented'
  dryerName: string; // Editable: e.g. "Namari Own Chamber 1", "Mani Dryer (Vandiperiyar)"
  rentedDryerContact?: string;
  rentalCostPerKg?: number;

  // Rental Client / Party Details
  partyName?: string;
  partyPhone?: string;
  partyAddress?: string;
  paymentStatus?: 'paid' | 'pending' | 'partial';

  // Weights & Timing
  greenWeightKg: number;
  ripenedFruitLoadedKg?: number; // Yellow/red fruit loaded on separator tray
  loadDate: string;
  dryWeightKg?: number;
  ripenedFruitDryKg?: number; // Cured output from separator tray
  unloadDate?: string;
  
  // Benchmark & Recovery
  benchmarkOutturnPercentage: number;
  recoveryPercentage?: number;
  ripenedFruitRecoveryPct?: number; // Outturn % specifically for ripened fruit
  overallRecoveryPct?: number; // Combined outturn % (standard green + ripe fruit)
  varianceFromBenchmark?: number;
  freshToDryRatio?: number;
  
  // Storage Packaging Tare
  dryPackagingItems?: PackagingItemUsed[];
  dryStorageSacksCount?: number;
  dryStoragePlasticBagsCount?: number;

  // Running days & Fuel Consumption
  runningDays: number;
  fuelConsumed: FuelConsumption;

  // Firing Logs & Grading
  firingLogs: FiringLogEntry[];
  totalFirewoodConsumed: number;
  grades?: CardamomGrading;
  
  harvestSourceIds?: string[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PepperDryingBatch {
  id: string; // e.g. 'PEP-2026-09-01'
  orgId: string;
  farmId: FarmId;
  status: 'drying' | 'completed';
  seasonYear: string;
  freshSpikesWeightKg: number;
  threshedBerriesWeightKg: number;
  dryBlackPepperKg?: number;
  benchmarkOutturnPercentage: number;
  recoveryPercentage?: number;
  varianceFromBenchmark?: number;
  dryingDays: number;
  dryPackagingItems?: PackagingItemUsed[];
  dryStorageSacksCount?: number;
  dryStoragePlasticBagsCount?: number;
  startDate: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface DryerComparisonItem {
  batchesCount: number;
  greenKg: number;
  dryKg: number;
  averageOutturn: number;
  runningDays: number;
}

export interface DryerComparisonSummary {
  seasonYear: string;
  ownBatches: DryerComparisonItem;
  rentedBatches: DryerComparisonItem;
  outturnAdvantage: number;
  rentedDryerBreakdown: Record<string, DryerComparisonItem>;
}

export interface FlushSummary {
  flushNumber: string;
  isLocked: boolean;
  totalFreshGrossKg: number;
  totalFreshNetKg: number;
  totalDryNetKg: number;
  acreage: number;
  freshKgPerAcre: number;
  dryKgPerAcre: number;
  totalPickingDays: number;
  totalWorkerHeadcount: number;
  averageKgPerWorker: number;
}

// CONSOLIDATED INTELLIGENCE DASHBOARD (Executive View)
export interface ConsolidatedSeasonIntelligence {
  seasonYear: string;
  asOfDate: string; // Timestamp when viewed
  totalWorkersDeployed: number;
  totalFreshNetKg: number;
  totalDryNetKg: number;
  averageOutturnPercentage: number;
  
  // Per Farm Breakdown
  farmBreakdown: Record<
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
  >;

  // Per Contractor Group Breakdown
  contractorBreakdown: Record<
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
  >;

  // Dryer Running & Operations
  dryerIntelligence: {
    ownRunningDays: number;
    rentedRunningDays: number;
    ownBatchesCount: number;
    rentedBatchesCount: number;
    ownAvgOutturn: number;
    rentedAvgOutturn: number;
    outturnAdvantage: number;
  };

  // Fuel Consumed (Wood, Petrol, Diesel, Engine Oil)
  totalFuelConsumed: FuelConsumption;

  // Flush Breakdown per Farm
  flushesBreakdown: Record<
    string,
    {
      namariFreshKg: number;
      adukidathanFreshKg: number;
      totalFreshKg: number;
      totalDryKg: number;
      totalWorkers: number;
    }
  >;
}

export interface HarvestSummary {
  totalCardamomGreenKg: number;
  totalPepperFreshKg: number;
  totalCoffeeKg: number;
  activeCuringBatchesCount: number;
  completedCuringBatchesCount: number;
  activePepperBatchesCount: number;
  averageCuringOutturn: number;
  estateBenchmarkOutturn: number;
  dryerComparison: DryerComparisonSummary;
}

export const DEFAULT_ESTATE_BENCHMARKS = {
  cardamomOutturnPercentage: 20.0,
  pepperOutturnPercentage: 34.0,
};

// Default Contractor Groups with exact "Own Estate" capitalization
export const DEFAULT_CONTRACTOR_GROUPS: ContractorGroupConfig[] = [
  { id: 'cg_own_estate', name: 'Own Estate workers', isOwnEstate: true },
  { id: 'cg_boopathi', name: 'Boopathi workers', isOwnEstate: false },
  { id: 'cg_thangamani', name: 'Thangamani workers', isOwnEstate: false },
];

// Configurable Default Packaging Materials
export const DEFAULT_PACKAGING_CONFIGS: PackagingItemUsed[] = [
  { id: 'pack_fresh_sack', name: 'Fresh PP Picking Sack', quantity: 10, tarePerUnitKg: 0.2, totalTareKg: 2.0 },
  { id: 'pack_dry_gunny', name: 'Gunny / Jute Storage Bag', quantity: 2, tarePerUnitKg: 1.1, totalTareKg: 2.2 },
  { id: 'pack_dry_plastic', name: 'Plastic Inner Liner Bag', quantity: 2, tarePerUnitKg: 0.1, totalTareKg: 0.2 },
];

export const STANDARD_LABOR_GROUPS = DEFAULT_CONTRACTOR_GROUPS;

export const ESTATE_ACREAGES: Record<FarmId, number> = {
  namari: 25.0,
  adukidathan: 30.0,
  consolidated: 55.0,
};
