import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loadPinSettings, savePin as storePin, clearPin, verifyStoredPin } from '../lib/pinStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { pinEnabled } = await loadPinSettings();
        setIsPinEnabled(pinEnabled);
        setIsUnlocked(!pinEnabled);
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

  const lockApp = useCallback(() => {
    setIsUnlocked(false);
  }, []);

  const verifyPin = useCallback(async (pin) => {
    return verifyStoredPin(pin);
  }, []);

  const savePin = useCallback(async (pin) => {
    await storePin(pin);
    setIsPinEnabled(true);
    setIsUnlocked(false);
  }, []);

  const removePin = useCallback(async () => {
    await clearPin();
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
        lockApp,
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
