import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['bio', '0', 'del'],
];

export default function PinLockScreen() {
  const { unlock, verifyPin } = useAuth();
  const insets = useSafeAreaInsets();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cooldownRef = useRef(null);

  useEffect(() => {
    (async () => {
      const hasHw = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHw && enrolled);
      if (hasHw && enrolled) {
        triggerBiometric();
      }
    })();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const shake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          setAttempts(0);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const triggerBiometric = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SCARS',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        unlock();
      }
    } catch {
      // biometric failed silently, fall back to PIN
    }
  }, [unlock]);

  const handleKey = useCallback(async (key) => {
    if (cooldown > 0) return;

    if (key === 'bio') {
      triggerBiometric();
      return;
    }

    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
      setError('');
      return;
    }

    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      const correct = await verifyPin(newPin);
      if (correct) {
        unlock();
      } else {
        shake();
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setError(`Too many attempts. Try again in ${COOLDOWN_SECONDS}s.`);
          startCooldown();
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} left.`);
        }
        setPin('');
      }
    }
  }, [pin, cooldown, attempts, verifyPin, unlock, shake, triggerBiometric, startCooldown]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      {/* Logo / App name */}
      <View style={styles.top}>
        <View style={styles.logoWrap}>
          <MaterialCommunityIcons name="shield-lock-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.appName}>SCARS</Text>
        <Text style={styles.subtitle}>Enter your PIN to continue</Text>
      </View>

      {/* 6-dot indicator */}
      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length && styles.dotFilled,
              error && styles.dotError,
            ]}
          />
        ))}
      </Animated.View>

      {/* Error / cooldown */}
      <View style={styles.errorWrap}>
        {cooldown > 0 ? (
          <Text style={styles.errorText}>
            Too many attempts. Wait {cooldown}s.
          </Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>

      {/* Number pad */}
      <View style={styles.pad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.padRow}>
            {row.map((key) => {
              if (key === 'bio') {
                return (
                  <Pressable
                    key={key}
                    style={({ pressed }) => [
                      styles.key,
                      styles.keySpecial,
                      !biometricAvailable && styles.keyHidden,
                      pressed && styles.keyPressed,
                    ]}
                    onPress={() => handleKey('bio')}
                    disabled={!biometricAvailable || cooldown > 0}
                  >
                    <MaterialCommunityIcons
                      name="fingerprint"
                      size={28}
                      color={biometricAvailable ? colors.primary : 'transparent'}
                    />
                  </Pressable>
                );
              }
              if (key === 'del') {
                return (
                  <Pressable
                    key={key}
                    style={({ pressed }) => [
                      styles.key,
                      styles.keySpecial,
                      pressed && styles.keyPressed,
                    ]}
                    onPress={() => handleKey('del')}
                    disabled={cooldown > 0}
                  >
                    <MaterialCommunityIcons
                      name="backspace-outline"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.key,
                    pressed && styles.keyPressed,
                    cooldown > 0 && styles.keyDisabled,
                  ]}
                  onPress={() => handleKey(key)}
                  disabled={cooldown > 0}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
    gap: 8,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginVertical: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.primary,
  },
  dotError: {
    borderColor: colors.danger,
    backgroundColor: colors.danger,
  },
  errorWrap: {
    height: 22,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.danger,
    textAlign: 'center',
  },
  pad: {
    width: '100%',
    paddingHorizontal: 32,
    gap: 12,
  },
  padRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  key: {
    flex: 1,
    height: 68,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keySpecial: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyPressed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyHidden: {
    opacity: 0,
  },
  keyText: {
    fontSize: 24,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
  },
});
