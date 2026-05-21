import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setApiToken, clearApiToken } from '../lib/apiClient';
import { saveSession, loadSession, clearSession } from '../lib/sessionStorage';

const LOCAL_DATA_KEY = '@debttracker_data_v1';
const LOCAL_CACHE_KEY = '@debttracker_cache_v1';

const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { token: storedToken, user: storedUser } = await loadSession();
        if (storedToken) {
          setApiToken(storedToken);
          setToken(storedToken);
          if (storedUser) {
            setUser(storedUser);
          } else {
            try {
              const me = await api.me();
              setUser({
                id: me._id?.toString() || me.id,
                name: me.name,
                email: me.email,
              });
            } catch {
              await clearSession();
              clearApiToken();
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch {
        await clearSession();
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
    await saveSession(newToken, newUser);
    setSessionKey((k) => k + 1);
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
      // import is best-effort
    }
  }, []);

  const register = useCallback(
    async ({ name, email, password, phone }) => {
      const data = await api.register({ name, email, password, phone });
      const normalizedUser = {
        id: data.user?.id || data.user?._id?.toString(),
        name: data.user?.name,
        email: data.user?.email,
      };
      await persistSession(data.token, normalizedUser);
      await tryImportLocalData();
      return data;
    },
    [persistSession, tryImportLocalData]
  );

  const login = useCallback(
    async ({ email, password }) => {
      const data = await api.login({ email, password });
      const normalizedUser = {
        id: data.user?.id || data.user?._id?.toString(),
        name: data.user?.name,
        email: data.user?.email,
      };
      await persistSession(data.token, normalizedUser);
      await tryImportLocalData();
      return data;
    },
    [persistSession, tryImportLocalData]
  );

  const logout = useCallback(async () => {
    clearApiToken();
    setToken(null);
    setUser(null);
    await clearSession();
    await AsyncStorage.multiRemove([LOCAL_CACHE_KEY, LOCAL_DATA_KEY]);
    setSessionKey((k) => k + 1);
  }, []);

  const isAuthenticated = !!token;

  return (
    <AccountContext.Provider
      value={{
        user,
        token,
        isReady,
        isAuthenticated,
        sessionKey,
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
