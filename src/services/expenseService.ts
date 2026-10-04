import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpenseEntry, PeriodType, ExpenseCategory } from '../types/expense';
import { isDateInPeriod } from '../utils/date';
import { addStockToExpendable } from './equipmentService';

function getExpensesKey(orgId: string): string {
  return `@plantation_expenses_${orgId}`;
}

// Initial realistic estate expense seeds
const INITIAL_EXPENSES: ExpenseEntry[] = [
  {
    id: 'exp_01',
    orgId: 'default',
    farmId: 'namari',
    date: '20-Sep-2026',
    paymentDate: '20-Sep-2026',
    category: 'fuel',
    fuelType: 'diesel',
    cropId: 'cardamom',
    title: 'Diesel for Cardamom Dryer Generator & Blower',
    amount: 4750,
    quantity: 50,
    unit: 'Litres',
    purchasedFrom: 'HPCL Fuel Station Bodimettu',
    billNumber: 'INV-HP-9241',
    paymentMode: 'upi',
    notes: 'Fuel loaded into main storage drum for curing flush.',
    createdAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'exp_02',
    orgId: 'default',
    farmId: 'namari',
    date: '19-Sep-2026',
    paymentDate: '19-Sep-2026',
    category: 'fuel',
    fuelType: 'petrol',
    cropId: 'cardamom',
    title: 'Petrol for Brush Cutters & Power Sprayers',
    amount: 2100,
    quantity: 20,
    unit: 'Litres',
    purchasedFrom: 'Indian Oil Munnar Road Bunk',
    billNumber: 'IOC-8841',
    paymentMode: 'cash',
    notes: 'For inter-row weed trimming ahead of picking.',
    createdAt: '2026-09-19T14:30:00.000Z',
  },
  {
    id: 'exp_03',
    orgId: 'default',
    farmId: 'namari',
    date: '18-Sep-2026',
    paymentDate: '18-Sep-2026',
    category: 'fuel',
    fuelType: 'engineOil',
    cropId: 'cardamom',
    title: 'Engine Oil 20W40 for Generator & Pumps',
    amount: 1450,
    quantity: 3,
    unit: 'Litres',
    purchasedFrom: 'Kalyani Auto Spares Nedumkandam',
    billNumber: 'BILL-4412',
    paymentMode: 'upi',
    notes: 'Periodic maintenance oil change.',
    createdAt: '2026-09-18T16:00:00.000Z',
  },
  {
    id: 'exp_04',
    orgId: 'default',
    farmId: 'namari',
    date: '17-Sep-2026',
    paymentDate: '17-Sep-2026',
    category: 'fuel',
    fuelType: 'firewood',
    cropId: 'cardamom',
    title: 'Dry Jungle Hardwood Logs for Curing Bhatti',
    amount: 8500,
    quantity: 25,
    unit: 'bundles',
    purchasedFrom: 'Murugesh Wood Depot',
    billNumber: 'MW-0194',
    paymentMode: 'cash',
    notes: 'Well-seasoned hardwood logs for optimal dryer temperature stability.',
    createdAt: '2026-09-17T11:00:00.000Z',
  },
  {
    id: 'exp_05',
    orgId: 'default',
    farmId: 'namari',
    date: '16-Sep-2026',
    paymentDate: '18-Sep-2026',
    category: 'fertilizer',
    cropId: 'cardamom',
    title: 'DAP (18-46-0) + MOP Potash 5 Bags',
    amount: 9800,
    quantity: 5,
    unit: 'bags',
    purchasedFrom: 'Munnar Agro Chemicals & Fertilizers',
    billNumber: 'MAC-6712',
    paymentMode: 'bank_transfer',
    notes: 'Pre-monsoon booster dose for cardamom clumps.',
    createdAt: '2026-09-16T09:30:00.000Z',
  },
  {
    id: 'exp_06',
    orgId: 'default',
    farmId: 'adukidathan',
    date: '15-Sep-2026',
    paymentDate: '15-Sep-2026',
    category: 'labor',
    cropId: 'cardamom',
    title: 'Boopathi Contractor Gang 1st Flush Advance',
    amount: 15000,
    quantity: 12,
    unit: 'workers',
    purchasedFrom: 'Boopathi Contractor',
    billNumber: 'VOUCH-082',
    paymentMode: 'cash',
    notes: 'Harvest labor group advance payout.',
    createdAt: '2026-09-15T18:00:00.000Z',
  },
];

export async function getExpenses(orgId: string): Promise<ExpenseEntry[]> {
  const key = getExpensesKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const seeded = INITIAL_EXPENSES.map((e) => ({ ...e, orgId }));
  await AsyncStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
}

export async function saveExpense(
  orgId: string,
  entry: ExpenseEntry,
  replenishStock = true
): Promise<ExpenseEntry[]> {
  const list = await getExpenses(orgId);
  const idx = list.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.unshift(entry);
  }
  await AsyncStorage.setItem(getExpensesKey(orgId), JSON.stringify(list));

  // Automatically add fuel or expendable to inventory if stock replenishment requested
  if (replenishStock && entry.quantity && entry.quantity > 0) {
    if (entry.category === 'fuel' && entry.fuelType) {
      await addStockToExpendable(orgId, entry.fuelType, entry.quantity, entry.unit);
    } else if (entry.category === 'fertilizer' || entry.category === 'chemicals') {
      await addStockToExpendable(orgId, entry.title, entry.quantity, entry.unit);
    }
  }

  return list;
}

export async function deleteExpense(orgId: string, id: string): Promise<ExpenseEntry[]> {
  const list = await getExpenses(orgId);
  const filtered = list.filter((e) => e.id !== id);
  await AsyncStorage.setItem(getExpensesKey(orgId), JSON.stringify(filtered));
  return filtered;
}

export function filterExpenses(
  entries: ExpenseEntry[],
  options: {
    farmId?: string;
    cropId?: string;
    category?: string;
    search?: string;
    period?: PeriodType;
    referenceDate?: Date;
  }
): ExpenseEntry[] {
  return entries.filter((e) => {
    // Farm filter
    if (options.farmId && options.farmId !== 'consolidated' && options.farmId !== 'all') {
      if (e.farmId !== options.farmId && e.farmId !== 'consolidated') {
        return false;
      }
    }

    // Crop filter
    if (options.cropId && options.cropId !== 'all') {
      if (e.cropId !== options.cropId && e.cropId !== 'all') {
        return false;
      }
    }

    // Category filter
    if (options.category && options.category !== 'all') {
      if (e.category !== options.category) {
        return false;
      }
    }

    // Period filter
    if (options.period && options.referenceDate) {
      if (!isDateInPeriod(e.date, options.period, options.referenceDate)) {
        return false;
      }
    }

    // Search filter
    if (options.search && options.search.trim().length > 0) {
      const q = options.search.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchVendor = e.purchasedFrom.toLowerCase().includes(q);
      const matchBill = e.billNumber ? e.billNumber.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchVendor && !matchBill) return false;
    }

    return true;
  });
}

export interface ExpenseMetrics {
  totalAmount: number;
  costPerAcre: number;
  count: number;
  topCategory: {
    category: ExpenseCategory | string;
    amount: number;
    percentage: number;
  } | null;
  categoryBreakdown: {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
  }[];
  fuelBreakdown: {
    petrolL: number;
    dieselL: number;
    engineOilL: number;
    woodBundles: number;
    totalFuelSpend: number;
  };
}

export function calculateExpenseMetrics(
  entries: ExpenseEntry[],
  acreage: number
): ExpenseMetrics {
  const totalAmount = entries.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const costPerAcre = acreage > 0 ? Math.round(totalAmount / acreage) : 0;

  // Category breakdown
  const catMap: Partial<Record<ExpenseCategory, number>> = {};
  entries.forEach((e) => {
    catMap[e.category] = (catMap[e.category] || 0) + (Number(e.amount) || 0);
  });

  const categoryBreakdown = Object.entries(catMap).map(([cat, amt]) => ({
    category: cat as ExpenseCategory,
    amount: amt,
    percentage: totalAmount > 0 ? Math.round((amt / totalAmount) * 100) : 0,
  }));

  categoryBreakdown.sort((a, b) => b.amount - a.amount);

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Fuel breakdown
  let petrolL = 0;
  let dieselL = 0;
  let engineOilL = 0;
  let woodBundles = 0;
  let totalFuelSpend = 0;

  entries.forEach((e) => {
    if (e.category === 'fuel') {
      totalFuelSpend += Number(e.amount) || 0;
      const q = Number(e.quantity) || 0;
      if (e.fuelType === 'petrol') petrolL += q;
      else if (e.fuelType === 'diesel') dieselL += q;
      else if (e.fuelType === 'engineOil') engineOilL += q;
      else if (e.fuelType === 'firewood') woodBundles += q;
    }
  });

  return {
    totalAmount,
    costPerAcre,
    count: entries.length,
    topCategory,
    categoryBreakdown,
    fuelBreakdown: {
      petrolL,
      dieselL,
      engineOilL,
      woodBundles,
      totalFuelSpend,
    },
  };
}
