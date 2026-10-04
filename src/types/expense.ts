import { CropType } from './crop';

export type FuelType = 'petrol' | 'diesel' | 'engineOil' | 'firewood' | 'custom';

export type ExpenseCategory =
  | 'labor'
  | 'fertilizer'
  | 'chemicals'
  | 'fuel'
  | 'maintenance'
  | 'packaging'
  | 'curingRental'
  | 'infrastructure'
  | 'adminMisc';

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'credit';

export type PeriodType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'halfYearly'
  | 'annual';

export interface ExpenseEntry {
  id: string;
  orgId: string;
  farmId: string; // 'farm_1', 'farm_2', or 'consolidated'
  date: string; // DD-MMM-YYYY format (e.g. 21-Sep-2026)
  paymentDate: string; // DD-MMM-YYYY format
  category: ExpenseCategory;
  fuelType?: FuelType;
  cropId: CropType | 'all';
  title: string;
  amount: number; // in ₹
  quantity?: number;
  unit?: string; // Litres, Bags, Bundles, Kg, Loads, etc.
  purchasedFrom: string; // Vendor / Merchant / Bunk / Contractor
  billNumber?: string; // Bill / Invoice / Cash memo number
  paymentMode: PaymentMode;
  notes?: string;
  billImageUri?: string; // Captured camera or gallery receipt image URI
  createdAt: string; // ISO timestamp
}
