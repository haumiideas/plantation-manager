import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

export type SyncAction = 'set' | 'update' | 'delete';

export interface SyncOperation {
  id: string;
  collection: string;
  docId: string;
  action: SyncAction;
  payload?: any;
  options?: { merge?: boolean };
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export const SYNC_QUEUE_KEY = '@plantation_pending_sync';

// In-memory queue listener registry
type SyncQueueListener = (pendingCount: number, isSyncing: boolean) => void;
const listeners: Set<SyncQueueListener> = new Set();
let isFlushingQueue = false;

function notifyListeners(count: number, isSyncing: boolean) {
  listeners.forEach((listener) => {
    try {
      listener(count, isSyncing);
    } catch (err) {
      console.warn('[syncQueueService] Error in sync listener callback:', err);
    }
  });
}

/**
 * Returns all currently pending sync operations from persistent AsyncStorage
 */
export async function getPendingSyncOperations(): Promise<SyncOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[syncQueueService] Failed to read sync queue:', err);
    return [];
  }
}

/**
 * Persists the sync queue to AsyncStorage
 */
async function saveSyncQueue(queue: SyncOperation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('[syncQueueService] Failed to persist sync queue:', err);
  }
}

/**
 * Returns the current pending queue count
 */
export async function getPendingSyncCount(): Promise<number> {
  const queue = await getPendingSyncOperations();
  return queue.length;
}

/**
 * Checks if the device has an active internet connection
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state: NetInfoState = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch (err) {
    return false;
  }
}

/**
 * Enqueues a write operation into persistent AsyncStorage for deferred cloud replay
 */
export async function enqueueSyncOperation(
  op: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>
): Promise<void> {
  const queue = await getPendingSyncOperations();
  const newOp: SyncOperation = {
    ...op,
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };

  // Replace existing pending operation for the same doc if safe, or append FIFO
  const existingIdx = queue.findIndex(
    (item) => item.collection === newOp.collection && item.docId === newOp.docId
  );

  if (existingIdx >= 0 && newOp.action !== 'delete' && queue[existingIdx].action !== 'delete') {
    // Merge newer updates to avoid redundant writes
    queue[existingIdx] = {
      ...queue[existingIdx],
      payload: { ...queue[existingIdx].payload, ...newOp.payload },
      timestamp: Date.now(),
    };
  } else {
    queue.push(newOp);
  }

  await saveSyncQueue(queue);
  notifyListeners(queue.length, isFlushingQueue);
  console.log(`[syncQueueService] Enqueued op (${newOp.action} ${newOp.collection}/${newOp.docId}). Total pending: ${queue.length}`);
}

/**
 * Atomically enqueues multiple operations (e.g. bulk attendance marking)
 */
export async function enqueueBatchSyncOperations(
  ops: Array<Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>>
): Promise<void> {
  if (ops.length === 0) return;
  const queue = await getPendingSyncOperations();

  ops.forEach((op) => {
    queue.push({
      ...op,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      retryCount: 0,
    });
  });

  await saveSyncQueue(queue);
  notifyListeners(queue.length, isFlushingQueue);
  console.log(`[syncQueueService] Batch enqueued ${ops.length} ops. Total pending: ${queue.length}`);
}

/**
 * Helper with a safety timeout to prevent hanging promises
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Attempts a direct write to Firestore if online. If offline or write fails,
 * reliably enqueues the operation to persistent AsyncStorage.
 *
 * @returns true if directly persisted to cloud, false if queued for offline sync.
 */
export async function executeCloudWriteOrQueue(
  collection: string,
  docId: string,
  action: SyncAction,
  payload?: any,
  options?: { merge?: boolean }
): Promise<boolean> {
  // If Firebase is not configured in this environment (e.g. initial demo setup),
  // we do not queue endlessly to keep demo mode lightweight.
  if (!isFirebaseConfigured || !db) {
    return false;
  }

  const online = await isOnline();

  if (online) {
    try {
      const firestoreDb = db;
      const docRef = doc(firestoreDb, collection, docId);

      if (action === 'set') {
        await withTimeout(setDoc(docRef, payload, options || { merge: true }));
      } else if (action === 'update') {
        await withTimeout(updateDoc(docRef, payload));
      } else if (action === 'delete') {
        await withTimeout(deleteDoc(docRef));
      }

      console.log(`[syncQueueService] Direct cloud write succeeded: ${action} ${collection}/${docId}`);
      return true;
    } catch (writeErr) {
      console.warn(`[syncQueueService] Cloud write failed (${action} ${collection}/${docId}), queueing for sync:`, writeErr);
      await enqueueSyncOperation({ collection, docId, action, payload, options });
      return false;
    }
  } else {
    console.log(`[syncQueueService] Device offline; queueing op: ${action} ${collection}/${docId}`);
    await enqueueSyncOperation({ collection, docId, action, payload, options });
    return false;
  }
}

/**
 * Replays all pending writes against Firestore in FIFO order.
 * Items are removed from the persistent queue ONLY after confirmed successful write.
 */
export async function flushSyncQueue(): Promise<{ success: number; failed: number }> {
  if (isFlushingQueue) {
    console.log('[syncQueueService] Sync flush already in progress. Skipping concurrent run.');
    const q = await getPendingSyncOperations();
    return { success: 0, failed: 0 };
  }

  if (!isFirebaseConfigured || !db) {
    return { success: 0, failed: 0 };
  }

  const online = await isOnline();
  if (!online) {
    console.log('[syncQueueService] Cannot flush queue: device is currently offline.');
    const q = await getPendingSyncOperations();
    notifyListeners(q.length, false);
    return { success: 0, failed: 0 };
  }

  isFlushingQueue = true;
  let queue = await getPendingSyncOperations();
  notifyListeners(queue.length, true);

  let successCount = 0;
  let failedCount = 0;
  const firestoreDb = db;

  console.log(`[syncQueueService] Starting queue flush for ${queue.length} pending operations...`);

  // Process sequentially in FIFO order
  while (queue.length > 0) {
    const op = queue[0];
    const docRef = doc(firestoreDb, op.collection, op.docId);
    let opSuccess = false;

    try {
      if (op.action === 'set') {
        await withTimeout(setDoc(docRef, op.payload, op.options || { merge: true }), 6000);
      } else if (op.action === 'update') {
        await withTimeout(updateDoc(docRef, op.payload), 6000);
      } else if (op.action === 'delete') {
        await withTimeout(deleteDoc(docRef), 6000);
      }
      opSuccess = true;
    } catch (err: any) {
      console.warn(`[syncQueueService] Replay failed for op ${op.id} (${op.collection}/${op.docId}):`, err?.message || err);
      op.retryCount = (op.retryCount || 0) + 1;
      op.lastError = String(err?.message || err);
      failedCount++;
    }

    if (opSuccess) {
      successCount++;
      // Re-read queue to ensure concurrency safety and remove the processed head
      const latestQueue = await getPendingSyncOperations();
      queue = latestQueue.filter((item) => item.id !== op.id);
      await saveSyncQueue(queue);
      notifyListeners(queue.length, true);
      console.log(`[syncQueueService] Successfully synced op ${op.id} (${op.collection}/${op.docId}). Remaining: ${queue.length}`);
    } else {
      // Replay failed: update retry count in persistent storage
      const latestQueue = await getPendingSyncOperations();
      const updatedLatest = latestQueue.map((item) => (item.id === op.id ? op : item));
      await saveSyncQueue(updatedLatest);

      // Stop flushing the rest of the queue to preserve FIFO ordering!
      console.warn(`[syncQueueService] Halting queue flush to preserve FIFO ordering. Remaining: ${updatedLatest.length}`);
      break;
    }
  }

  isFlushingQueue = false;
  const finalQueue = await getPendingSyncOperations();
  notifyListeners(finalQueue.length, false);

  console.log(`[syncQueueService] Flush finished: ${successCount} succeeded, ${failedCount} failed. Remaining in queue: ${finalQueue.length}`);
  return { success: successCount, failed: failedCount };
}

/**
 * Subscribes a callback to sync queue status updates.
 * Provides real-time pending count and syncing state.
 */
export function subscribeToSyncQueue(listener: SyncQueueListener): () => void {
  listeners.add(listener);
  // Immediately provide current status
  getPendingSyncCount().then((count) => {
    listener(count, isFlushingQueue);
  });

  return () => {
    listeners.delete(listener);
  };
}

let isListenerInitialized = false;

/**
 * Initializes NetInfo connection listener to trigger queue flush on network reconnect,
 * and performs an initial flush on app launch.
 */
export function initSyncQueueListener(): () => void {
  if (isListenerInitialized) {
    return () => {};
  }
  isListenerInitialized = true;
  console.log('[syncQueueService] Initializing offline sync network listener...');

  // Attempt initial flush on launch if online
  isOnline().then((online) => {
    if (online) {
      flushSyncQueue().catch((err) => {
        console.warn('[syncQueueService] Initial flush failed:', err);
      });
    }
  });

  // Listen for network connectivity changes
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    console.log(`[syncQueueService] NetInfo status update: isConnected=${state.isConnected}, reachable=${state.isInternetReachable}`);

    if (online) {
      console.log('[syncQueueService] Device back online! Auto-flushing pending sync queue...');
      flushSyncQueue().catch((err) => {
        console.warn('[syncQueueService] Auto-flush on reconnect failed:', err);
      });
    }
  });

  return () => {
    unsubscribe();
    isListenerInitialized = false;
  };
}
