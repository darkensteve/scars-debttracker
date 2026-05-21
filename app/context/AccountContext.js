import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setApiToken, clearApiToken } from '../lib/apiClient';

const TOKEN_KEY = 'scars_auth_token';
const USER_KEY = 'scars_auth_user';
const LOCAL_DATA_KEY = '@debttracker_data_v1';

const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        if (storedToken) {
          setApiToken(storedToken);
          setToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            const me = await api.me();
            setUser({ id: me._id, name: me.name, email: me.email });
          }
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        clearApiToken();
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const persistSession = useCallback(async (newToken, newUser) => {
    setApiToken(newToken);
    setToken(newToken);
    setUser(newUser);
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
  }, []);

  const tryImportLocalData = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_DATA_KEY);
      if (!raw) return;
      const local = JSON.parse(raw);
      if (!local.contacts?.length && !local.transactions?.length) return;
      await api.importData({
        contacts: local.contacts,
        transactions: local.transactions,
        settings: local.settings,
      });
      await AsyncStorage.removeItem(LOCAL_DATA_KEY);
    } catch {
      // import is best-effort (e.g. account already has data)
    }
  }, []);

  const register = useCallback(async ({ name, email, password, phone }) => {
    const data = await api.register({ name, email, password, phone });
    await persistSession(data.token, data.user);
    await tryImportLocalData();
    return data;
  }, [persistSession, tryImportLocalData]);

  const login = useCallback(async ({ email, password }) => {
    const data = await api.login({ email, password });
    await persistSession(data.token, data.user);
    await tryImportLocalData();
    return data;
  }, [persistSession, tryImportLocalData]);

  const logout = useCallback(async () => {
    clearApiToken();
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }, []);

  const isAuthenticated = !!token;

  return (
    <AccountContext.Provider
      value={{
        user,
        token,
        isReady,
        isAuthenticated,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside AccountProvider');
  return ctx;
}
