import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

/**
 * GCash-style protections:
 * - Hide app preview in recent apps / block screenshots when sensitive UI is shown
 * - Re-lock with PIN when app goes to background
 */
export function useAppSecurity({ enabled, isLocked, onLock }) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web' || !enabled) {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      return undefined;
    }

    const shouldShield = enabled && !isLocked;

    if (shouldShield) {
      ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    }

    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, [enabled, isLocked]);

  useEffect(() => {
    if (!enabled || !onLock) return undefined;

    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appState.current;
      appState.current = nextState;

      if (
        prev === 'active' &&
        (nextState === 'background' || nextState === 'inactive')
      ) {
        onLock();
      }
    });

    return () => sub.remove();
  }, [enabled, onLock]);
}
