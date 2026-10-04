import { PaymentMode } from './expense';

export type IncomeCategory =
  | 'produce_sale'          // Direct produce sale to traders/buyers
  | 'farm_tour'            // Tourist / Farm Tour admission / guide fee
  | 'educational_visit'     // Educational / University study program fee
  | 'scrap_sale'            // Waste / scrap / empty drum sales
  | 'curing_rental'         // Rental curing service income
  | 'consulting_honorarium' // Field advisory / knowledge sharing
  | 'other_income';         // Miscellaneous farm receipts

export interface IncomeEntry {
  id: string;
  orgId: string;
  farmId: string; // 'namari', 'adukidathan', or 'consolidated'
  date: string; // '24-Sep-2026'
  category: IncomeCategory;
  title: string;
  amount: number; // in ₹
  payerName: string;
  payerPhone?: string;
  payerAddress?: string;
  payerGstin?: string;
  paymentMode: PaymentMode;
  receiptNumber?: string;
  linkedVisitorId?: string;
  notes?: string;
  // Produce sale specific
  produceWeightKg?: number;
  produceRatePerKg?: number;
  produceCrop?: string;
  produceGrade?: string;
  // Farm tour specific
  tourVisitorsCount?: number;
  tourRatePerPerson?: number;
  tourPackageName?: string;
  // Educational visit specific
  institutionName?: string;
  studentCount?: number;
  studentFee?: number;
  // Curing rental specific
  curingWeightKg?: number;
  curingRatePerKg?: number;
  curingBatchNo?: string;
  // Scrap sale specific
  scrapItemType?: string;
  scrapQuantity?: number;
  scrapUnit?: string;
  scrapRate?: number;
  // Advisory / Consulting specific
  advisoryTopic?: string;
  advisoryHours?: number;
  advisoryFee?: number;
  createdAt: string; // ISO
}
