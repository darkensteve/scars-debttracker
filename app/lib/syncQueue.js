import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './apiClient';
import { isLocalId } from './localId';

const QUEUE_KEY = '@debttracker_sync_queue_v1';

export async function loadQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveQueue(queue) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function clearQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function removeQueueItemsForLocalContact(localId) {
  const queue = await loadQueue();
  const filtered = queue.filter((op) => {
    if (op.type === 'CREATE_CONTACT' && op.localId === localId) return false;
    if (op.refId === localId) return false;
    if (op.payload?.contactId === localId) return false;
    return true;
  });
  await saveQueue(filtered);
}

export async function removeQueueItemsForLocalTransaction(localId) {
  const queue = await loadQueue();
  const filtered = queue.filter(
    (op) => !(op.type === 'CREATE_TRANSACTION' && op.localId === localId)
  );
  await saveQueue(filtered);
}

export async function enqueue(item) {
  const queue = await loadQueue();
  queue.push({ ...item, queuedAt: new Date().toISOString() });
  await saveQueue(queue);
  return queue.length;
}

function mapContactFromApi(c) {
  return {
    id: (c.id || c._id)?.toString(),
    name: c.name,
    phone: c.phone || '',
    notes: c.notes || '',
    photoUri: c.photoUri || null,
    createdAt: c.createdAt,
  };
}

function mapTransactionFromApi(t) {
  return {
    id: (t.id || t._id)?.toString(),
    contactId:
      typeof t.contactId === 'object' ? t.contactId._id?.toString() : String(t.contactId),
    amount: t.amount,
    type: t.type,
    description: t.description || '',
    date: t.date,
    dueDate: t.dueDate || null,
  };
}

function remapContactId(id, idMap) {
  if (!id) return id;
  return idMap[id] || id;
}

function applyIdMapToState(contacts, transactions, idMap) {
  if (!Object.keys(idMap).length) {
    return { contacts, transactions };
  }
  const nextContacts = contacts.map((c) =>
    idMap[c.id] ? { ...c, id: idMap[c.id] } : c
  );
  const nextTransactions = transactions.map((t) => ({
    ...t,
    contactId: remapContactId(t.contactId, idMap),
    id: idMap[t.id] ? idMap[t.id] : t.id,
  }));
  return { contacts: nextContacts, transactions: nextTransactions };
}

async function processOne(op, idMap) {
  switch (op.type) {
    case 'CREATE_CONTACT': {
      const res = await api.createContact(op.payload);
      if (!res?.contact?.id) throw new Error('Invalid contact response');
      const serverId = res.contact.id.toString();
      idMap[op.localId] = serverId;
      return { kind: 'contact', localId: op.localId, serverId, contact: mapContactFromApi(res.contact) };
    }
    case 'UPDATE_CONTACT': {
      const refId = remapContactId(op.refId, idMap);
      if (isLocalId(refId)) throw new Error('Contact not synced yet');
      await api.updateContact(refId, op.payload);
      return { kind: 'noop' };
    }
    case 'DELETE_CONTACT': {
      const refId = remapContactId(op.refId, idMap);
      if (isLocalId(refId)) return { kind: 'noop' };
      await api.deleteContact(refId);
      return { kind: 'noop' };
    }
    case 'CREATE_TRANSACTION': {
      const contactId = remapContactId(op.payload.contactId, idMap);
      if (isLocalId(contactId)) throw new Error('Contact not synced yet');
      const res = await api.createTransaction({ ...op.payload, contactId });
      if (!res?.transaction?.id) throw new Error('Invalid transaction response');
      const serverId = (res.transaction.id || res.transaction._id).toString();
      idMap[op.localId] = serverId;
      return {
        kind: 'transaction',
        localId: op.localId,
        serverId,
        transaction: mapTransactionFromApi(res.transaction),
      };
    }
    case 'DELETE_TRANSACTION': {
      const refId = idMap[op.refId] || op.refId;
      if (isLocalId(refId)) return { kind: 'noop' };
      await api.deleteTransaction(refId);
      return { kind: 'noop' };
    }
    case 'UPDATE_SETTINGS': {
      await api.updateSettings(op.payload);
      return { kind: 'noop' };
    }
    default:
      return { kind: 'noop' };
  }
}

/**
 * Flush pending ops to the server. Returns updated local state + remaining queue length.
 */
export async function flushSyncQueue({ contacts, transactions, settings }) {
  let queue = await loadQueue();
  if (!queue.length) {
    return { contacts, transactions, settings, pendingCount: 0, idMap: {} };
  }

  const idMap = {};
  let nextContacts = [...contacts];
  let nextTransactions = [...transactions];
  let nextSettings = { ...settings };
  const remaining = [];

  for (const op of queue) {
    try {
      const result = await processOne(op, idMap);
      if (result.kind === 'contact') {
        nextContacts = nextContacts.map((c) =>
          c.id === result.localId ? { ...result.contact, id: result.serverId } : c
        );
      }
      if (result.kind === 'transaction') {
        nextTransactions = nextTransactions.map((t) =>
          t.id === result.localId
            ? { ...result.transaction, id: result.serverId, contactId: result.transaction.contactId }
            : t
        );
      }
    } catch {
      remaining.push(op);
      break;
    }
  }

  const merged = applyIdMapToState(nextContacts, nextTransactions, idMap);
  nextContacts = merged.contacts;
  nextTransactions = merged.transactions;

  await saveQueue(remaining);
  return {
    contacts: nextContacts,
    transactions: nextTransactions,
    settings: nextSettings,
    pendingCount: remaining.length,
    idMap,
  };
}
