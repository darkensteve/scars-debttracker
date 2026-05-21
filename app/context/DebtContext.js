import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { balanceDelta, contactBalance, totalOwed } from '../utils/balance';
import { computeDueDateISO } from '../utils/due';
import { useAccount } from './AccountContext';
import { api } from '../lib/apiClient';

const LOCAL_CACHE_KEY = '@debttracker_cache_v1';

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
    contactId: typeof t.contactId === 'object' ? t.contactId._id?.toString() : String(t.contactId),
    amount: t.amount,
    type: t.type,
    description: t.description || '',
    date: t.date,
    dueDate: t.dueDate || null,
  };
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

  const loadFromCloud = useCallback(async () => {
    const data = await api.sync();
    const nextContacts = (data.contacts || []).map(mapContactFromApi);
    const nextTransactions = (data.transactions || []).map(mapTransactionFromApi);
    const nextSettings = {
      businessName: data.settings?.businessName || 'SCARS',
      currency: data.settings?.currency || '₱',
    };
    setContacts(nextContacts);
    setTransactions(nextTransactions);
    setSettings(nextSettings);
    await cacheLocally(nextContacts, nextTransactions, nextSettings);
    return { nextContacts, nextTransactions, nextSettings };
  }, [cacheLocally]);

  useEffect(() => {
    if (!token) {
      setIsReady(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await loadFromCloud();
      } catch (e) {
        console.error('Failed to load cloud data', e);
        try {
          const raw = await AsyncStorage.getItem(LOCAL_CACHE_KEY);
          if (raw && !cancelled) {
            const data = JSON.parse(raw);
            setContacts(data.contacts || []);
            setTransactions(data.transactions || []);
            setSettings((prev) => ({ ...prev, ...(data.settings || {}) }));
          }
        } catch {
          // ignore
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, loadFromCloud]);

  const saveAll = useCallback(
    async (nextContacts, nextTransactions, nextSettings = settings) => {
      setContacts(nextContacts);
      setTransactions(nextTransactions);
      setSettings(nextSettings);
      await cacheLocally(nextContacts, nextTransactions, nextSettings);
    },
    [cacheLocally, settings]
  );

  const addContact = useCallback(
    async ({ name, phone, notes, photoUri }) => {
      const payload = {
        name: name.trim(),
        phone: (phone || '').trim(),
        notes: (notes || '').trim(),
        photoUri: photoUri || null,
      };
      const res = await api.createContact(payload);
      const contact = mapContactFromApi(res.contact);
      const nextContacts = [contact, ...contacts];
      await saveAll(nextContacts, transactions);
      return contact;
    },
    [contacts, transactions, saveAll]
  );

  const updateContact = useCallback(
    async (id, updates) => {
      const body = {};
      if (updates.name !== undefined) body.name = updates.name.trim();
      if (updates.phone !== undefined) body.phone = updates.phone.trim();
      if (updates.notes !== undefined) body.notes = updates.notes.trim();
      if (updates.photoUri !== undefined) body.photoUri = updates.photoUri || null;

      await api.updateContact(id, body);

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
    },
    [contacts, transactions, saveAll]
  );

  const deleteContact = useCallback(
    async (id) => {
      await api.deleteContact(id);
      const nextContacts = contacts.filter((c) => c.id !== id);
      const nextTransactions = transactions.filter((t) => t.contactId !== id);
      await saveAll(nextContacts, nextTransactions);
    },
    [contacts, transactions, saveAll]
  );

  const addTransaction = useCallback(
    async ({ contactId, amount, type, description }) => {
      const value = Number(amount);
      if (!contactId || !value || value <= 0) {
        throw new Error('Invalid transaction');
      }
      const createdAtISO = new Date().toISOString();
      const dueDate = computeDueDateISO({ type, createdAtISO });

      const res = await api.createTransaction({
        contactId,
        amount: value,
        type,
        description: (description || '').trim(),
        date: createdAtISO,
        dueDate,
      });

      const transaction = mapTransactionFromApi(res.transaction);
      const nextTransactions = [transaction, ...transactions];
      await saveAll(contacts, nextTransactions);
      return transaction;
    },
    [contacts, transactions, saveAll]
  );

  const deleteTransaction = useCallback(
    async (id) => {
      await api.deleteTransaction(id);
      const nextTransactions = transactions.filter((t) => t.id !== id);
      await saveAll(contacts, nextTransactions);
    },
    [contacts, transactions, saveAll]
  );

  const updateSettings = useCallback(
    async (updates) => {
      const nextSettings = { ...settings, ...updates };
      await api.updateSettings({
        businessName: nextSettings.businessName,
        currency: nextSettings.currency,
      });
      await saveAll(contacts, transactions, nextSettings);
    },
    [contacts, transactions, settings, saveAll]
  );

  const clearAllData = useCallback(async () => {
    for (const t of [...transactions]) {
      await api.deleteTransaction(t.id);
    }
    for (const c of [...contacts]) {
      await api.deleteContact(c.id);
    }
    const emptySettings = { businessName: 'SCARS', currency: '₱' };
    await api.updateSettings(emptySettings);
    setContacts([]);
    setTransactions([]);
    setSettings(emptySettings);
    await cacheLocally([], [], emptySettings);
  }, [contacts, transactions]);

  const refreshFromCloud = useCallback(async () => {
    await loadFromCloud();
  }, [loadFromCloud]);

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
      recentTransactions: [...transactions].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    }),
    [
      isReady,
      isAuthenticated,
      contacts,
      transactions,
      settings,
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
