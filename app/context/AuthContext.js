import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const STORE_PIN = 'scars_pin';
const STORE_PIN_ENABLED = 'scars_pin_enabled';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const enabled = await SecureStore.getItemAsync(STORE_PIN_ENABLED);
        const pinEnabled = enabled === 'true';
        setIsPinEnabled(pinEnabled);
        if (!pinEnabled) setIsUnlocked(true);
      } catch {
        setIsUnlocked(true);
      } finally {
        setIsAuthReady(true);
      }
    })();
  }, []);

  const unlock = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  const verifyPin = useCallback(async (pin) => {
    try {
      const stored = await SecureStore.getItemAsync(STORE_PIN);
      return stored === pin;
    } catch {
      return false;
    }
  }, []);

  const savePin = useCallback(async (pin) => {
    await SecureStore.setItemAsync(STORE_PIN, pin);
    await SecureStore.setItemAsync(STORE_PIN_ENABLED, 'true');
    setIsPinEnabled(true);
  }, []);

  const removePin = useCallback(async () => {
    await SecureStore.deleteItemAsync(STORE_PIN);
    await SecureStore.setItemAsync(STORE_PIN_ENABLED, 'false');
    setIsPinEnabled(false);
    setIsUnlocked(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isPinEnabled,
        isUnlocked,
        isAuthReady,
        unlock,
        verifyPin,
        savePin,
        removePin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
