import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toTransactionDateISO } from '../lib/dateFilters';
import { balanceDelta, contactBalance, totalOwed } from '../utils/balance';
import { computeDueDateISO } from '../utils/due';
import { useAccount } from './AccountContext';
import { api } from '../lib/apiClient';
import { createLocalId, isLocalId } from '../lib/localId';
import { getIsOnline, subscribeNetwork } from '../lib/networkStatus';
import {
  clearQueue,
  enqueue,
  flushSyncQueue,
  loadQueue,
  removeQueueItemsForLocalContact,
  removeQueueItemsForLocalTransaction,
  saveQueue,
} from '../lib/syncQueue';

const LOCAL_CACHE_KEY = '@debttracker_cache_v1';
const AUTO_SYNC_INTERVAL_MS = Platform.OS === 'web' ? 120000 : 20000;

const DebtContext = createContext(null);

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

async function loadLocalCache() {
  const raw = await AsyncStorage.getItem(LOCAL_CACHE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function DebtProvider({ children }) {
  const { isAuthenticated, token } = useAccount();
  const [contacts, setContacts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({
    businessName: 'SCARS',
    currency: '₱',
  });
  const [isReady, setIsReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const stateRef = useRef({ contacts, transactions, settings });
  stateRef.current = { contacts, transactions, settings };

  const syncGuard = useRef({ inFlight: false, lastAt: 0 });

  const refreshPendingCount = useCallback(async () => {
    const queue = await loadQueue();
    setPendingSyncCount(queue.length);
  }, []);

  const cacheLocally = useCallback(async (nextContacts, nextTransactions, nextSettings) => {
    await AsyncStorage.setItem(
      LOCAL_CACHE_KEY,
      JSON.stringify({
        contacts: nextContacts,
        transactions: nextTransactions,
        settings: nextSettings,
      })
    );
  }, []);

  const saveAll = useCallback(
    async (nextContacts, nextTransactions, nextSettings) => {
      const resolvedSettings = nextSettings ?? stateRef.current.settings;
      setContacts(nextContacts);
      setTransactions(nextTransactions);
      setSettings(resolvedSettings);
      await cacheLocally(nextContacts, nextTransactions, resolvedSettings);
    },
    [cacheLocally]
  );

  const loadFromCloud = useCallback(async () => {
    const data = await api.sync();
    const nextContacts = (data.contacts || []).map(mapContactFromApi);
    const nextTransactions = (data.transactions || []).map(mapTransactionFromApi);
    const nextSettings = {
      businessName: data.settings?.businessName || 'SCARS',
      currency: data.settings?.currency || '₱',
    };
    await saveAll(nextContacts, nextTransactions, nextSettings);
    return { nextContacts, nextTransactions, nextSettings };
  }, [saveAll]);

  const runSync = useCallback(
    async ({ pullFromCloud = true } = {}) => {
      const online = await getIsOnline();
      if (!online) {
        setIsOffline(true);
        await refreshPendingCount();
        return false;
      }

      setIsOffline(false);
      setIsSyncing(true);
      try {
        const { contacts: c, transactions: t, settings: s } = stateRef.current;
        const flushed = await flushSyncQueue({ contacts: c, transactions: t, settings: s });
        await saveAll(flushed.contacts, flushed.transactions, flushed.settings);
        setPendingSyncCount(flushed.pendingCount);

        if (pullFromCloud && flushed.pendingCount === 0) {
          try {
            await loadFromCloud();
          } catch (e) {
            console.error('Cloud refresh after sync failed', e);
          }
        }
        await refreshPendingCount();
        return true;
      } catch (e) {
        console.error('Sync failed', e);
        await refreshPendingCount();
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [saveAll, loadFromCloud, refreshPendingCount]
  );

  const runSyncThrottled = useCallback(
    async ({ pullFromCloud = true, force = false } = {}) => {
      if (syncGuard.current.inFlight) return false;

      const elapsed = Date.now() - syncGuard.current.lastAt;
      if (!force && elapsed < AUTO_SYNC_INTERVAL_MS) return false;

      syncGuard.current.inFlight = true;
      try {
        return await runSync({ pullFromCloud });
      } finally {
        syncGuard.current.inFlight = false;
        syncGuard.current.lastAt = Date.now();
      }
    },
    [runSync]
  );

  const syncNow = useCallback(
    () => runSyncThrottled({ pullFromCloud: true, force: true }),
    [runSyncThrottled]
  );

  useEffect(() => {
    if (!token) {
      setIsReady(false);
      return undefined;
    }

    let cancelled = false;
    syncGuard.current.lastAt = 0;

    (async () => {
      const online = await getIsOnline();
      if (!cancelled) setIsOffline(!online);

      try {
        const cached = await loadLocalCache();
        if (cached && !cancelled) {
          setContacts(cached.contacts || []);
          setTransactions(cached.transactions || []);
          setSettings((prev) => ({ ...prev, ...(cached.settings || {}) }));
        }
      } catch {
        // ignore
      }

      if (!cancelled) setIsReady(true);
      await refreshPendingCount();

      if (online && !cancelled) {
        await runSyncThrottled({ pullFromCloud: true, force: true });
      }
    })();

    if (Platform.OS === 'web') {
      return () => {
        cancelled = true;
      };
    }

    const unsubNet = subscribeNetwork((online) => {
      setIsOffline(!online);
      if (online) {
        runSyncThrottled({ pullFromCloud: true });
      }
    });

    const appSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        runSyncThrottled({ pullFromCloud: true });
      }
    });

    return () => {
      cancelled = true;
      unsubNet();
      appSub.remove();
    };
  }, [token, runSyncThrottled, refreshPendingCount]);

  const addContact = useCallback(
    async ({ name, phone, notes, photoUri }) => {
      const payload = {
        name: name.trim(),
        phone: (phone || '').trim(),
        notes: (notes || '').trim(),
        photoUri: photoUri || null,
      };
      const localId = createLocalId('local');
      const contact = {
        id: localId,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      const nextContacts = [contact, ...contacts];
      await saveAll(nextContacts, transactions);

      const online = await getIsOnline();
      if (online) {
        try {
          const res = await api.createContact(payload);
          if (!res?.contact) throw new Error('Invalid response from server.');
          const serverContact = mapContactFromApi(res.contact);
          const remapped = nextContacts.map((c) => (c.id === localId ? serverContact : c));
          await saveAll(remapped, transactions);
          await refreshPendingCount();
          return serverContact;
        } catch {
          await enqueue({ type: 'CREATE_CONTACT', localId, payload });
          await refreshPendingCount();
          return contact;
        }
      }

      await enqueue({ type: 'CREATE_CONTACT', localId, payload });
      await refreshPendingCount();
      return contact;
    },
    [contacts, transactions, saveAll, refreshPendingCount]
  );

  const updateContact = useCallback(
    async (id, updates) => {
      const body = {};
      if (updates.name !== undefined) body.name = updates.name.trim();
      if (updates.phone !== undefined) body.phone = updates.phone.trim();
      if (updates.notes !== undefined) body.notes = updates.notes.trim();
      if (updates.photoUri !== undefined) body.photoUri = updates.photoUri || null;

      const nextContacts = contacts.map((c) =>
        c.id === id
          ? {
              ...c,
              ...updates,
              name: updates.name !== undefined ? updates.name.trim() : c.name,
              phone: updates.phone !== undefined ? updates.phone.trim() : c.phone,
              notes: updates.notes !== undefined ? updates.notes.trim() : c.notes,
              photoUri:
                updates.photoUri !== undefined ? updates.photoUri || null : c.photoUri,
            }
          : c
      );
      await saveAll(nextContacts, transactions);

      if (isLocalId(id)) {
        const queue = await loadQueue();
        const updated = queue.map((op) =>
          op.type === 'CREATE_CONTACT' && op.localId === id
            ? { ...op, payload: { ...op.payload, ...body } }
            : op
        );
        await saveQueue(updated);
        await refreshPendingCount();
        return;
      }

      const online = await getIsOnline();
      if (online) {
        try {
          await api.updateContact(id, body);
          return;
        } catch {
          // fall through to queue
        }
      }
      await enqueue({ type: 'UPDATE_CONTACT', refId: id, payload: body });
      await refreshPendingCount();
    },
    [contacts, transactions, saveAll, refreshPendingCount]
  );

  const deleteContact = useCallback(
    async (id) => {
      const nextContacts = contacts.filter((c) => c.id !== id);
      const nextTransactions = transactions.filter((t) => t.contactId !== id);
      await saveAll(nextContacts, nextTransactions);

      if (isLocalId(id)) {
        await removeQueueItemsForLocalContact(id);
        await refreshPendingCount();
        return;
      }

      const online = await getIsOnline();
      if (online) {
        try {
          await api.deleteContact(id);
          await refreshPendingCount();
          return;
        } catch {
          // queue
        }
      }
      await enqueue({ type: 'DELETE_CONTACT', refId: id });
      await refreshPendingCount();
    },
    [contacts, transactions, saveAll, refreshPendingCount]
  );

  const addTransaction = useCallback(
    async ({ contactId, amount, type, description, date: transactionDate }) => {
      const value = Number(amount);
      if (!contactId || !value || value <= 0) {
        throw new Error('Invalid transaction');
      }
      const createdAtISO = transactionDate
        ? toTransactionDateISO(transactionDate)
        : new Date().toISOString();
      const dueDate = computeDueDateISO({ type, createdAtISO });
      const payload = {
        contactId,
        amount: value,
        type,
        description: (description || '').trim(),
        date: createdAtISO,
        dueDate,
      };

      const localId = createLocalId('local-tx');
      const transaction = {
        id: localId,
        contactId,
        amount: value,
        type,
        description: payload.description,
        date: createdAtISO,
        dueDate,
      };
      const nextTransactions = [transaction, ...transactions];
      await saveAll(contacts, nextTransactions);

      const online = await getIsOnline();
      if (online) {
        try {
          const res = await api.createTransaction(payload);
          const serverTx = mapTransactionFromApi(res.transaction);
          const remapped = nextTransactions.map((t) =>
            t.id === localId ? serverTx : t
          );
          await saveAll(contacts, remapped);
          await refreshPendingCount();
          return serverTx;
        } catch {
          await enqueue({ type: 'CREATE_TRANSACTION', localId, payload });
          await refreshPendingCount();
          return transaction;
        }
      }

      await enqueue({ type: 'CREATE_TRANSACTION', localId, payload });
      await refreshPendingCount();
      return transaction;
    },
    [contacts, transactions, saveAll, refreshPendingCount]
  );

  const deleteTransaction = useCallback(
    async (id) => {
      const nextTransactions = transactions.filter((t) => t.id !== id);
      await saveAll(contacts, nextTransactions);

      if (isLocalId(id)) {
        await removeQueueItemsForLocalTransaction(id);
        await refreshPendingCount();
        return;
      }

      const online = await getIsOnline();
      if (online) {
        try {
          await api.deleteTransaction(id);
          await refreshPendingCount();
          return;
        } catch {
          // queue
        }
      }
      await enqueue({ type: 'DELETE_TRANSACTION', refId: id });
      await refreshPendingCount();
    },
    [contacts, transactions, saveAll, refreshPendingCount]
  );

  const updateSettings = useCallback(
    async (updates) => {
      const nextSettings = { ...settings, ...updates };
      const payload = {
        businessName: nextSettings.businessName,
        currency: nextSettings.currency,
      };
      await saveAll(contacts, transactions, nextSettings);

      const online = await getIsOnline();
      if (online) {
        try {
          await api.updateSettings(payload);
          return;
        } catch {
          // queue
        }
      }
      await enqueue({ type: 'UPDATE_SETTINGS', payload });
      await refreshPendingCount();
    },
    [contacts, transactions, settings, saveAll, refreshPendingCount]
  );

  const clearAllData = useCallback(async () => {
    const online = await getIsOnline();
    if (online) {
      try {
        for (const t of [...transactions]) {
          if (!isLocalId(t.id)) await api.deleteTransaction(t.id);
        }
        for (const c of [...contacts]) {
          if (!isLocalId(c.id)) await api.deleteContact(c.id);
        }
        const emptySettings = { businessName: 'SCARS', currency: '₱' };
        await api.updateSettings(emptySettings);
      } catch (e) {
        console.error('Clear cloud data failed', e);
      }
    }
    await clearQueue();
    const emptySettings = { businessName: 'SCARS', currency: '₱' };
    setContacts([]);
    setTransactions([]);
    setSettings(emptySettings);
    await cacheLocally([], [], emptySettings);
    setPendingSyncCount(0);
  }, [contacts, transactions, cacheLocally]);

  const refreshFromCloud = useCallback(async () => {
    await runSyncThrottled({ pullFromCloud: true, force: true });
  }, [runSyncThrottled]);

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions]
  );

  const getContactById = useCallback(
    (id) => contacts.find((c) => c.id === id),
    [contacts]
  );

  const getTransactionsForContact = useCallback(
    (contactId) =>
      transactions
        .filter((t) => t.contactId === contactId)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions]
  );

  const value = useMemo(
    () => ({
      isReady: isAuthenticated ? isReady : false,
      isOffline,
      pendingSyncCount,
      isSyncing,
      syncNow,
      contacts,
      transactions,
      settings,
      totalOwed: totalOwed(transactions, contacts),
      contactBalance: (contactId) => contactBalance(transactions, contactId),
      balanceDelta,
      addContact,
      updateContact,
      deleteContact,
      addTransaction,
      deleteTransaction,
      updateSettings,
      clearAllData,
      refreshFromCloud,
      getContactById,
      getTransactionsForContact,
      recentTransactions,
    }),
    [
      isReady,
      isAuthenticated,
      isOffline,
      pendingSyncCount,
      isSyncing,
      syncNow,
      contacts,
      transactions,
      settings,
      recentTransactions,
      addContact,
      updateContact,
      deleteContact,
      addTransaction,
      deleteTransaction,
      updateSettings,
      clearAllData,
      refreshFromCloud,
      getContactById,
      getTransactionsForContact,
    ]
  );

  return <DebtContext.Provider value={value}>{children}</DebtContext.Provider>;
}

export function useDebt() {
  const ctx = useContext(DebtContext);
  if (!ctx) {
    throw new Error('useDebt must be used within DebtProvider');
  }
  return ctx;
}
