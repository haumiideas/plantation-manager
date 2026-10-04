import { FarmId } from './farm';
import { WorkerCategory } from './worker';

export type AttendanceStatus = 'present' | 'half_day' | 'absent' | 'unmarked';
export type EstateDayType = 'working_day' | 'estate_holiday';

export interface AttendanceRecord {
  id: string; // Deterministic: `${farmId}_${date}_${workerId}`
  orgId: string;
  farmId: FarmId; // Which farm deployed to today ('namari' | 'adukidathan')
  date: string; // ISO date string: YYYY-MM-DD
  workerId: string;
  workerName: string;
  category: WorkerCategory;
  status: AttendanceStatus;
  overtimeHours: number; // OT hours provision (0, 1, 2, 3...)
  dailyWageRate: number; // Point-in-time frozen wage snapshot for this day
  overtimeRatePerHour: number; // Point-in-time frozen OT rate snapshot for this day
  isWageOverriddenToday?: boolean; // Flag if overridden for hard/hazardous work today
  allocatedTask: string; // e.g. "Cardamom Picking (2nd Flush)", "Pepper Plucking", "Bordeaux Spray"
  block?: string; // e.g. "Ridge Block A", "Valley Block 2"
  notes?: string;
  recordedByUid: string;
  recordedByName: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  totalActiveWorkers: number;
  presentCount: number;
  halfDayCount: number;
  absentCount: number;
  unmarkedCount: number;
  totalOvertimeHours: number;
  totalEstimatedWage: number;
}
