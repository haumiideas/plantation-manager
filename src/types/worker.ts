import { CropType } from './crop';
import { FarmId } from './farm';

export type WorkerCategory = 'picker' | 'sprayer' | 'weeder' | 'curing_crew' | 'general';
export type WorkerStatus = 'active' | 'left_farm';

export interface PlantationWorker {
  id: string;
  orgId: string;
  farmId?: FarmId; // Primary farm or common to organization
  name: string;
  phone?: string;
  category: WorkerCategory;
  crops: CropType[];
  skills?: string[]; // Kept for worker profile reference
  dailyWageRate: number; // Current standard base rate (e.g. ₹500/day) - Admin template
  overtimeRatePerHour: number; // Current standard OT rate (e.g. ₹80/hour) - Admin template
  status: WorkerStatus; // 'active' or 'left_farm' (left farm workers excluded from muster)
  leftFarmDate?: string;
  notes?: string;
  createdAt: string;
}

export const WORKER_CATEGORY_LABELS: Record<WorkerCategory, string> = {
  picker: 'Cardamom/Pepper Picker',
  sprayer: 'Chemical/Spray Operator',
  weeder: 'Weeding & Mulching Crew',
  curing_crew: 'Curing & Processing Crew',
  general: 'General Farm Labor',
};
