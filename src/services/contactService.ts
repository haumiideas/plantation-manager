import AsyncStorage from '@react-native-async-storage/async-storage';
import { EstateContact, ContactCategory } from '../types/contact';

function getContactsKey(orgId: string): string {
  return `@plantation_contacts_${orgId}`;
}

const INITIAL_CONTACTS: EstateContact[] = [
  {
    id: 'cnt_01',
    orgId: 'default',
    name: 'K.R. Ramanathan',
    phone: '+91 94470 12845',
    address: 'Vandiperiyar Road, Kumily',
    category: 'party_client',
    companyOrOrg: 'Ramanathan Small Cardamom Holdings',
    notes: 'Regular curing client for 500kg batches.',
    lastInteractionDate: '2026-09-21',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'cnt_02',
    orgId: 'default',
    name: 'M. Selvaraj (V.K. Spices)',
    phone: '+91 98421 77309',
    address: 'Market Road, Bodinayakanur',
    category: 'trader',
    companyOrOrg: 'V.K. Spices Trading Co.',
    notes: 'Direct cardamom auction and farm-gate buyer.',
    lastInteractionDate: '2026-09-22',
    createdAt: '2026-09-02T09:00:00.000Z',
  },
  {
    id: 'cnt_03',
    orgId: 'default',
    name: 'Dr. K. Swaminathan',
    phone: '+91 94432 66100',
    address: 'Spices Board Regional Center, Myladumpara',
    category: 'govt_scientist',
    companyOrOrg: 'ICRI / Spices Board India',
    notes: 'Senior agronomist advisory for thrips and capsule borer.',
    lastInteractionDate: '2026-09-18',
    createdAt: '2026-09-03T10:00:00.000Z',
  },
  {
    id: 'cnt_04',
    orgId: 'default',
    name: 'Anand Kumar',
    phone: '+91 97891 33412',
    address: 'Theni Highway, Cumbum',
    category: 'chemical_rep',
    companyOrOrg: 'Syngenta Crop Protection',
    notes: 'Bio-stimulant and fungicide technical representative.',
    lastInteractionDate: '2026-09-15',
    createdAt: '2026-09-04T11:00:00.000Z',
  },
  {
    id: 'cnt_05',
    orgId: 'default',
    name: 'Murugesan (Scrap Buyer)',
    phone: '+91 96290 88451',
    address: 'Anakkara Bypass, Idukki',
    category: 'waste_collector',
    companyOrOrg: 'Murugesan Scrap & Waste Clearance',
    notes: 'Collects plastic pesticide drums, scrap metal wire, cardboard sacks.',
    lastInteractionDate: '2026-09-12',
    createdAt: '2026-09-05T12:00:00.000Z',
  },
];

export async function getEstateContacts(orgId: string): Promise<EstateContact[]> {
  const key = getContactsKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load contacts from storage', err);
  }

  // Seed initial contacts
  try {
    await AsyncStorage.setItem(key, JSON.stringify(INITIAL_CONTACTS));
  } catch {}
  return INITIAL_CONTACTS;
}

export async function saveEstateContact(
  orgId: string,
  contact: Omit<EstateContact, 'id' | 'createdAt'> & { id?: string }
): Promise<EstateContact> {
  const contacts = await getEstateContacts(orgId);
  const now = new Date().toISOString();

  let savedContact: EstateContact;
  if (contact.id) {
    savedContact = {
      ...contact,
      id: contact.id,
      createdAt: now,
    } as EstateContact;
    const index = contacts.findIndex((c) => c.id === contact.id);
    if (index >= 0) {
      contacts[index] = savedContact;
    } else {
      contacts.unshift(savedContact);
    }
  } else {
    savedContact = {
      ...contact,
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
    };
    contacts.unshift(savedContact);
  }

  const key = getContactsKey(orgId);
  await AsyncStorage.setItem(key, JSON.stringify(contacts));
  return savedContact;
}

export async function deleteEstateContact(orgId: string, id: string): Promise<void> {
  const contacts = await getEstateContacts(orgId);
  const filtered = contacts.filter((c) => c.id !== id);
  const key = getContactsKey(orgId);
  await AsyncStorage.setItem(key, JSON.stringify(filtered));
}

export async function upsertContactFromPartyOrVisitor(
  orgId: string,
  name: string,
  phone: string,
  address?: string,
  category: ContactCategory = 'party_client',
  companyOrOrg?: string
): Promise<void> {
  if (!name.trim() || !phone.trim()) return;

  const contacts = await getEstateContacts(orgId);
  const cleanPhone = phone.trim().replace(/[\s-]/g, '');
  const existing = contacts.find(
    (c) => c.phone.trim().replace(/[\s-]/g, '') === cleanPhone || c.name.toLowerCase() === name.trim().toLowerCase()
  );

  const today = new Date().toISOString().split('T')[0];

  if (existing) {
    existing.name = name.trim();
    if (phone.trim()) existing.phone = phone.trim();
    if (address?.trim()) existing.address = address.trim();
    if (companyOrOrg?.trim()) existing.companyOrOrg = companyOrOrg.trim();
    existing.lastInteractionDate = today;
  } else {
    contacts.unshift({
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orgId,
      name: name.trim(),
      phone: phone.trim(),
      address: address?.trim(),
      category,
      companyOrOrg: companyOrOrg?.trim(),
      lastInteractionDate: today,
      createdAt: new Date().toISOString(),
    });
  }

  const key = getContactsKey(orgId);
  await AsyncStorage.setItem(key, JSON.stringify(contacts));
}
