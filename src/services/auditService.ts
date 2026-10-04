import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, isFirebaseConfigured } from '../config/firebase';
import { executeCloudWriteOrQueue } from './syncQueueService';

export interface AuditEvent {
  id: string;
  orgId: string;
  timestamp: string;
  performedByUid: string;
  performedByName: string;
  action: 'create' | 'update' | 'delete' | 'override';
  entityType: 'attendance' | 'harvest' | 'curing' | 'expense' | 'equipment' | 'day_status';
  entityId?: string;
  title: string;
  details: string;
  previousValue?: any;
  newValue?: any;
}

const AUDIT_COLLECTION = 'audit_logs';

function getAuditKey(orgId: string): string {
  return `@plantation_audit_log_${orgId}`;
}

export async function logAuditEvent(
  eventData: Omit<AuditEvent, 'id' | 'timestamp'>
): Promise<AuditEvent> {
  const auditEvent: AuditEvent = {
    ...eventData,
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  const key = getAuditKey(auditEvent.orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    const list: AuditEvent[] = raw ? JSON.parse(raw) : [];
    // Keep most recent 500 audit events in local storage
    list.unshift(auditEvent);
    if (list.length > 500) {
      list.length = 500;
    }
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    // continue
  }

  await executeCloudWriteOrQueue(AUDIT_COLLECTION, auditEvent.id, 'set', auditEvent);

  return auditEvent;
}

export async function getAuditLogs(
  orgId: string,
  limitCount: number = 50
): Promise<AuditEvent[]> {
  const key = getAuditKey(orgId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const list: AuditEvent[] = JSON.parse(raw);
      return list.slice(0, limitCount);
    }
  } catch {
    // continue
  }
  return [];
}
