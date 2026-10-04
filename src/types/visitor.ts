import { PaymentMode } from './expense';

export type VisitorCategory =
  | 'field_consultant'   // Field Consultant / Agronomist
  | 'chemical_rep'       // Chemical / Fertilizer Company Representative
  | 'produce_buyer'      // Produce Buyer / Direct Cardamom & Pepper Trader
  | 'tourist'            // Tourist / Farm Tour Visit
  | 'educational'        // Educational / University / Student Visit
  | 'govt_scientist'     // Government Official / Spices Board / Scientist
  | 'waste_collector'    // Garbage Collector / Rag Picker / Scrap Buyer
  | 'other';             // Other Visitors

export type VisitorFinanceType = 'none' | 'paid_expense' | 'received_income';

export interface VisitorEntry {
  id: string;
  orgId: string;
  farmId: string; // 'namari', 'adukidathan', or 'consolidated'
  date: string; // '24-Sep-2026'
  time?: string; // '10:30 AM'
  visitorName: string;
  phone: string;
  organization?: string; // Company / Institution / Farm name
  address?: string;
  category: VisitorCategory;
  fieldActivity: string; // Activity conducted in the field (e.g., Soil testing & pest advisory, Cardamom purchase sample, Farm tour 8 guests, Scrap metal & plastic clearance)
  personsCount?: number; // Number of persons in the group
  vehicleNumber?: string; // Vehicle registration number if any

  // Financial Transaction
  financeType: VisitorFinanceType;
  amount?: number; // in ₹
  paymentMode?: PaymentMode;
  transactionNotes?: string;
  linkedExpenseId?: string; // Expense ID if cost paid to visitor
  linkedIncomeId?: string;  // Income ID if income received from visitor

  notes?: string;
  createdAt: string; // ISO
}
