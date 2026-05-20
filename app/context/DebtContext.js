import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { balanceDelta, contactBalance, totalOwed } from '../utils/balance';
import { computeDueDateISO } from '../utils/due';

const STORAGE_KEY = '@debttracker_data_v1';

const DebtContext = createContext(null);

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function DebtProvider({ children }) {
  const [contacts, setContacts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({
    businessName: 'SCARS',
    currency: '₱',
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setContacts(data.contacts || []);
          setTransactions(data.transactions || []);
          setSettings((prev) => ({ ...prev, ...(data.settings || {}) }));
        }
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (nextContacts, nextTransactions, nextSettings) => {
    const payload = {
      contacts: nextContacts,
      transactions: nextTransactions,
      settings: nextSettings,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, []);

  const saveAll = useCallback(
    async (nextContacts, nextTransactions, nextSettings = settings) => {
      setContacts(nextContacts);
      setTransactions(nextTransactions);
      setSettings(nextSettings);
      await persist(nextContacts, nextTransactions, nextSettings);
    },
    [persist, settings]
  );

  const addContact = useCallback(
    async ({ name, phone, notes, photoUri }) => {
      const contact = {
        id: createId(),
        name: name.trim(),
        phone: (phone || '').trim(),
        notes: (notes || '').trim(),
        photoUri: photoUri || null,
        createdAt: new Date().toISOString(),
      };
      const nextContacts = [contact, ...contacts];
      await saveAll(nextContacts, transactions);
      return contact;
    },
    [contacts, transactions, saveAll]
  );

  const updateContact = useCallback(
    async (id, updates) => {
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
      const transaction = {
        id: createId(),
        contactId,
        amount: value,
        type,
        description: (description || '').trim(),
        date: createdAtISO,
        dueDate: computeDueDateISO({ type, createdAtISO }),
      };
      const nextTransactions = [transaction, ...transactions];
      await saveAll(contacts, nextTransactions);
      return transaction;
    },
    [contacts, transactions, saveAll]
  );

  const deleteTransaction = useCallback(
    async (id) => {
      const nextTransactions = transactions.filter((t) => t.id !== id);
      await saveAll(contacts, nextTransactions);
    },
    [contacts, transactions, saveAll]
  );

  const updateSettings = useCallback(
    async (updates) => {
      const nextSettings = { ...settings, ...updates };
      await saveAll(contacts, transactions, nextSettings);
    },
    [contacts, transactions, settings, saveAll]
  );

  const clearAllData = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setContacts([]);
    setTransactions([]);
    setSettings({ businessName: 'SCARS', currency: '₱' });
  }, []);

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
      isReady,
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
      getContactById,
      getTransactionsForContact,
      recentTransactions: [...transactions].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    }),
    [
      isReady,
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
