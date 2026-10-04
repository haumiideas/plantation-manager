import AsyncStorage from '@react-native-async-storage/async-storage';
import { IncomeEntry, IncomeCategory } from '../types/income';

function getIncomeKey(orgId: string): string {
  return `@plantation_income_${orgId}`;
}

const INITIAL_INCOME: IncomeEntry[] = [
  {
    id: 'inc_01',
    orgId: 'default',
    farmId: 'namari',
    date: '22-Sep-2026',
    category: 'produce_sale',
    title: 'Farm-Gate Advance for 350kg Dry Cardamom',
    amount: 70000,
    payerName: 'M. Selvaraj (V.K. Spices)',
    payerPhone: '+91 98421 77309',
    paymentMode: 'bank_transfer',
    receiptNumber: 'REC-VKS-109',
    notes: 'Advance against dry green capsules delivered at estate store.',
    createdAt: '2026-09-22T14:00:00.000Z',
  },
  {
    id: 'inc_02',
    orgId: 'default',
    farmId: 'namari',
    date: '20-Sep-2026',
    category: 'farm_tour',
    title: 'Plantation Walk & Cardamom Dryer Experience (8 guests)',
    amount: 4000,
    payerName: 'Green Meadows Eco Tour Group',
    payerPhone: '+91 94461 55210',
    paymentMode: 'upi',
    receiptNumber: 'REC-TOUR-04',
    notes: '2-hour shaded cardamom trail walk and tea tasting.',
    createdAt: '2026-09-20T16:30:00.000Z',
  },
  {
    id: 'inc_03',
    orgId: 'default',
    farmId: 'adukidathan',
    date: '16-Sep-2026',
    category: 'scrap_sale',
    title: 'Sale of Empty HDPE Chemical Barrels & Scrap Iron Wire',
    amount: 3200,
    payerName: 'Murugesan (Scrap Buyer)',
    payerPhone: '+91 96290 88451',
    paymentMode: 'cash',
    receiptNumber: 'REC-SCRAP-88',
    notes: '20 washed empty fungicide drums + 60kg rusted wire.',
    createdAt: '2026-09-16T11:00:00.000Z',
  },
];

export async function getIncomeEntries(
  orgId: string,
  farmId?: string
): Promise<IncomeEntry[]> {
  const key = getIncomeKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    let list: IncomeEntry[] = raw ? JSON.parse(raw) : [];
    if (!raw) {
      list = INITIAL_INCOME;
      await AsyncStorage.setItem(key, JSON.stringify(list));
    }
    if (farmId && farmId !== 'consolidated') {
      return list.filter((item) => item.farmId === farmId);
    }
    return list;
  } catch (err) {
    console.error('Failed to load income entries', err);
    return INITIAL_INCOME;
  }
}

export async function saveIncomeEntry(
  orgId: string,
  entry: Omit<IncomeEntry, 'id' | 'createdAt'> & { id?: string }
): Promise<IncomeEntry> {
  const key = getIncomeKey(orgId);
  const current = await getIncomeEntries(orgId);
  const now = new Date().toISOString();

  let savedEntry: IncomeEntry;
  if (entry.id) {
    savedEntry = {
      ...entry,
      id: entry.id,
      createdAt: now,
    } as IncomeEntry;
    const index = current.findIndex((i) => i.id === entry.id);
    if (index >= 0) {
      current[index] = savedEntry;
    } else {
      current.unshift(savedEntry);
    }
  } else {
    savedEntry = {
      ...entry,
      id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
    };
    current.unshift(savedEntry);
  }

  await AsyncStorage.setItem(key, JSON.stringify(current));
  return savedEntry;
}

export async function deleteIncomeEntry(orgId: string, id: string): Promise<void> {
  const key = getIncomeKey(orgId);
  const current = await getIncomeEntries(orgId);
  const filtered = current.filter((i) => i.id !== id);
  await AsyncStorage.setItem(key, JSON.stringify(filtered));
}

export function calculateTotalIncome(entries: IncomeEntry[]): number {
  return entries.reduce((acc, curr) => acc + (curr.amount || 0), 0);
}

export async function generateNextReceiptNumber(orgId: string, farmId?: string): Promise<string> {
  const current = await getIncomeEntries(orgId);
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const div = farmId === 'adukidathan' ? 'ADU' : farmId === 'namari' ? 'NAM' : 'EST';
  const seq = 1040 + current.length + 1;
  return `REC-${yy}-${div}-${seq}`;
}
