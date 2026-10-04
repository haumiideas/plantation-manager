import AsyncStorage from '@react-native-async-storage/async-storage';
import { VisitorEntry, VisitorCategory, VisitorFinanceType } from '../types/visitor';
import { saveExpense, deleteExpense } from './expenseService';
import { saveIncomeEntry, deleteIncomeEntry } from './incomeService';
import { upsertContactFromPartyOrVisitor } from './contactService';
import { logAuditEvent } from './auditService';
import { executeCloudWriteOrQueue } from './syncQueueService';
import { ContactCategory } from '../types/contact';

const VISITORS_COLLECTION = 'visitor_entries';

function getVisitorsKey(orgId: string): string {
  return `@plantation_visitors_${orgId}`;
}

const INITIAL_VISITORS: VisitorEntry[] = [
  {
    id: 'vis_01',
    orgId: 'default',
    farmId: 'namari',
    date: '23-Sep-2026',
    time: '10:30 AM',
    visitorName: 'Dr. K. Swaminathan',
    phone: '+91 94432 66100',
    organization: 'ICRI / Spices Board India',
    address: 'Regional Research Station, Myladumpara',
    category: 'govt_scientist',
    fieldActivity: 'Inspected Block 1 & 2 for root grub infestation and thrips capsule blemish. Advised neem cake and beauveria drenching.',
    personsCount: 2,
    vehicleNumber: 'KL-06-E-4210',
    financeType: 'paid_expense',
    amount: 1500,
    paymentMode: 'upi',
    transactionNotes: 'Field consultation honorarium & soil sample analysis fee.',
    linkedExpenseId: 'exp_vis_01',
    notes: 'Sampled soil from 4 cardamom trenches.',
    createdAt: '2026-09-23T11:00:00.000Z',
  },
  {
    id: 'vis_02',
    orgId: 'default',
    farmId: 'namari',
    date: '22-Sep-2026',
    time: '02:15 PM',
    visitorName: 'M. Selvaraj',
    phone: '+91 98421 77309',
    organization: 'V.K. Spices Trading Co.',
    address: 'Bodinayakanur Spices Market',
    category: 'produce_buyer',
    fieldActivity: 'Inspected fresh cardamom picking lot from Gang 1. Tested 8mm capsule moisture and color. Negotiated farm-gate purchase.',
    personsCount: 1,
    vehicleNumber: 'TN-60-AZ-1124',
    financeType: 'received_income',
    amount: 70000,
    paymentMode: 'bank_transfer',
    transactionNotes: 'Farm-gate purchase advance against 350kg dry lot.',
    linkedIncomeId: 'inc_vis_02',
    notes: 'Agreed on ₹2,350/kg for 8mm bold green grade.',
    createdAt: '2026-09-22T14:30:00.000Z',
  },
  {
    id: 'vis_03',
    orgId: 'default',
    farmId: 'namari',
    date: '20-Sep-2026',
    time: '09:00 AM',
    visitorName: 'Vinod Nair & Group',
    phone: '+91 94461 55210',
    organization: 'Green Meadows Eco Tour Group',
    address: 'Munnar Tourism Circuit',
    category: 'tourist',
    fieldActivity: 'Guided educational walk through cardamom canopy, shade trees, bee boxes, and live dryer chamber demonstration.',
    personsCount: 8,
    vehicleNumber: 'KL-07-CD-8899',
    financeType: 'received_income',
    amount: 4000,
    paymentMode: 'upi',
    transactionNotes: 'Farm tour entry fee (₹500 x 8 guests).',
    linkedIncomeId: 'inc_vis_03',
    notes: 'Guests purchased 4 packets of cured cardamom from estate store.',
    createdAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'vis_04',
    orgId: 'default',
    farmId: 'namari',
    date: '19-Sep-2026',
    time: '11:45 AM',
    visitorName: 'Anand Kumar',
    phone: '+91 97891 33412',
    organization: 'Syngenta Crop Protection',
    address: 'Theni Highway, Cumbum',
    category: 'chemical_rep',
    fieldActivity: 'Demonstrated new systemic bio-fungicide for capsule rot (Azhukal disease). Provided free 500ml trial sample bottle.',
    personsCount: 2,
    vehicleNumber: 'TN-58-B-3312',
    financeType: 'none',
    notes: 'Trial plot designated in Block 2 shade area.',
    createdAt: '2026-09-19T12:00:00.000Z',
  },
  {
    id: 'vis_05',
    orgId: 'default',
    farmId: 'adukidathan',
    date: '16-Sep-2026',
    time: '03:30 PM',
    visitorName: 'Murugesan',
    phone: '+91 96290 88451',
    organization: 'Murugesan Scrap & Waste Clearance',
    address: 'Anakkara Bypass, Idukki',
    category: 'waste_collector',
    fieldActivity: 'Collected 20 rinsed empty chemical HDPE containers and 60kg scrap barbed wire from lower store yard.',
    personsCount: 2,
    vehicleNumber: 'KL-06-M-5510',
    financeType: 'received_income',
    amount: 3200,
    paymentMode: 'cash',
    transactionNotes: 'Scrap barrel and metal wire clearance receipt.',
    linkedIncomeId: 'inc_vis_05',
    notes: 'Ensured triple-rinsed certificates signed for pesticide drums.',
    createdAt: '2026-09-16T16:00:00.000Z',
  },
];

export async function getVisitorEntries(
  orgId: string,
  farmId?: string
): Promise<VisitorEntry[]> {
  const key = getVisitorsKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    let list: VisitorEntry[] = raw ? JSON.parse(raw) : [];
    if (!raw) {
      list = INITIAL_VISITORS;
      await AsyncStorage.setItem(key, JSON.stringify(list));
    }
    if (farmId && farmId !== 'consolidated') {
      return list.filter((item) => item.farmId === farmId);
    }
    return list;
  } catch (err) {
    console.error('Failed to load visitors', err);
    return INITIAL_VISITORS;
  }
}

export async function saveVisitorEntry(
  orgId: string,
  entry: Omit<VisitorEntry, 'id' | 'createdAt'> & { id?: string }
): Promise<VisitorEntry> {
  const key = getVisitorsKey(orgId);
  const current = await getVisitorEntries(orgId);
  const now = new Date().toISOString();
  const visitorId = entry.id || `vis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let linkedExpenseId = entry.linkedExpenseId;
  let linkedIncomeId = entry.linkedIncomeId;

  // 1. Automatic Expense Tracker Integration
  if (entry.financeType === 'paid_expense' && entry.amount && entry.amount > 0) {
    try {
      const expCategory =
        entry.category === 'field_consultant'
          ? 'adminMisc'
          : entry.category === 'chemical_rep'
          ? 'chemicals'
          : 'adminMisc';

      const expId = linkedExpenseId || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await saveExpense(orgId, {
        id: expId,
        orgId,
        farmId: entry.farmId,
        date: entry.date,
        paymentDate: entry.date,
        category: expCategory,
        cropId: 'all',
        title: `Visitor Payment: ${entry.visitorName} (${getCategoryLabel(entry.category)})`,
        amount: entry.amount,
        quantity: 1,
        unit: 'Service',
        purchasedFrom: entry.organization
          ? `${entry.visitorName} (${entry.organization})`
          : entry.visitorName,
        paymentMode: entry.paymentMode || 'cash',
        notes: `Auto-logged from Visitors Log. Activity in field: ${entry.fieldActivity}. Phone: ${entry.phone}`,
        createdAt: now,
      });
      linkedExpenseId = expId;
    } catch (e) {
      console.error('Failed to auto-create expense from visitor', e);
    }
  }

  // 2. Automatic Income Tracker Integration
  if (entry.financeType === 'received_income' && entry.amount && entry.amount > 0) {
    try {
      const incCategory =
        entry.category === 'produce_buyer'
          ? 'produce_sale'
          : entry.category === 'tourist'
          ? 'farm_tour'
          : entry.category === 'waste_collector'
          ? 'scrap_sale'
          : entry.category === 'educational'
          ? 'educational_visit'
          : 'other_income';

      const inc = await saveIncomeEntry(orgId, {
        id: linkedIncomeId,
        orgId,
        farmId: entry.farmId,
        date: entry.date,
        category: incCategory,
        title: `Visitor Receipt: ${entry.visitorName} (${getCategoryLabel(entry.category)})`,
        amount: entry.amount,
        payerName: entry.organization
          ? `${entry.visitorName} (${entry.organization})`
          : entry.visitorName,
        payerPhone: entry.phone,
        paymentMode: entry.paymentMode || 'cash',
        linkedVisitorId: visitorId,
        notes: `Auto-logged from Visitors Log. Activity in field: ${entry.fieldActivity}`,
      });
      linkedIncomeId = inc.id;
    } catch (e) {
      console.error('Failed to auto-create income from visitor', e);
    }
  }

  // 3. Automatic Estate Contact Log Sync
  try {
    const contactCat: ContactCategory =
      entry.category === 'produce_buyer'
        ? 'trader'
        : entry.category === 'field_consultant'
        ? 'consultant'
        : entry.category === 'chemical_rep'
        ? 'chemical_rep'
        : entry.category === 'govt_scientist'
        ? 'govt_scientist'
        : entry.category === 'waste_collector'
        ? 'waste_collector'
        : entry.category === 'tourist'
        ? 'tourist'
        : entry.category === 'educational'
        ? 'educational'
        : 'other';

    await upsertContactFromPartyOrVisitor(
      orgId,
      entry.visitorName,
      entry.phone,
      entry.address,
      contactCat,
      entry.organization
    );
  } catch (e) {
    console.error('Failed to sync contact log', e);
  }

  const savedEntry: VisitorEntry = {
    ...entry,
    id: visitorId,
    linkedExpenseId,
    linkedIncomeId,
    createdAt: now,
  };

  const existingIdx = current.findIndex((v) => v.id === visitorId);
  if (existingIdx >= 0) {
    current[existingIdx] = savedEntry;
  } else {
    current.unshift(savedEntry);
  }

  await AsyncStorage.setItem(key, JSON.stringify(current));

  await executeCloudWriteOrQueue(VISITORS_COLLECTION, savedEntry.id, 'set', savedEntry);

  logAuditEvent({
    orgId,
    performedByUid: 'user_local',
    performedByName: 'Supervisor',
    action: entry.id ? 'update' : 'create',
    entityType: 'expense',
    title: `Visitor Logged: ${entry.visitorName}`,
    details: `${getCategoryLabel(entry.category)} - ${entry.fieldActivity} (${entry.financeType})`,
  });

  return savedEntry;
}

export async function deleteVisitorEntry(orgId: string, id: string): Promise<void> {
  const key = getVisitorsKey(orgId);
  const current = await getVisitorEntries(orgId);
  const item = current.find((v) => v.id === id);

  if (item) {
    if (item.linkedExpenseId) {
      try {
        await deleteExpense(orgId, item.linkedExpenseId);
      } catch {}
    }
    if (item.linkedIncomeId) {
      try {
        await deleteIncomeEntry(orgId, item.linkedIncomeId);
      } catch {}
    }
  }

  const filtered = current.filter((v) => v.id !== id);
  await AsyncStorage.setItem(key, JSON.stringify(filtered));

  await executeCloudWriteOrQueue(VISITORS_COLLECTION, id, 'delete');

  logAuditEvent({
    orgId,
    performedByUid: 'user_local',
    performedByName: 'Supervisor',
    action: 'delete',
    entityType: 'expense',
    title: 'Visitor Entry Deleted',
    details: `Visitor ID ${id}`,
  });
}

export function getCategoryLabel(cat: VisitorCategory): string {
  switch (cat) {
    case 'field_consultant':
      return 'Field Consultant';
    case 'chemical_rep':
      return 'Chemical / Fertilizer Rep';
    case 'produce_buyer':
      return 'Produce Buyer / Trader';
    case 'tourist':
      return 'Farm Tour / Tourist';
    case 'educational':
      return 'Educational Visit';
    case 'govt_scientist':
      return 'Govt / Spices Board Scientist';
    case 'waste_collector':
      return 'Waste Collector / Rag Picker';
    default:
      return 'Other Visitor';
  }
}
