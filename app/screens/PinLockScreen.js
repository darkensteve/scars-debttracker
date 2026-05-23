import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAccount } from '../context/AccountContext';
import { api } from '../lib/apiClient';
import { formatPhoneHint, isValidPhone } from '../lib/phoneUtils';
import { colors } from '../theme/colors';

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
  const { unlock, verifyPin, savePinAndUnlock } = useAuth();
  const { user } = useAccount();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState('lock'); // lock | forgot | reset
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  const [resetStep, setResetStep] = useState(1);
  const [firstNewPin, setFirstNewPin] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cooldownRef = useRef(null);

  useEffect(() => {
    (async () => {
      const hasHw = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHw && enrolled);
      if (hasHw && enrolled && mode === 'lock') {
        triggerBiometric();
      }
    })();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [mode]);

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
      // fall back to PIN
    }
  }, [unlock]);

  const handleLockKey = useCallback(
    async (key) => {
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
            setError(
              `Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} left.`
            );
          }
          setPin('');
        }
      }
    },
    [pin, cooldown, attempts, verifyPin, unlock, shake, triggerBiometric, startCooldown]
  );

  const handleResetKey = useCallback(
    async (key) => {
      if (key === 'del') {
        setPin((p) => p.slice(0, -1));
        setError('');
        return;
      }

      const newPin = pin + key;
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        if (resetStep === 1) {
          setFirstNewPin(newPin);
          setPin('');
          setError('');
          setResetStep(2);
        } else if (newPin === firstNewPin) {
          await savePinAndUnlock(newPin);
        } else {
          shake();
          setError("PINs don't match. Start again.");
          setPin('');
          setResetStep(1);
          setFirstNewPin('');
        }
      }
    },
    [pin, resetStep, firstNewPin, savePinAndUnlock, shake]
  );

  const handleVerifyRecovery = async () => {
    setRecoveryError('');
    if (!isValidPhone(recoveryPhone)) {
      setRecoveryError('Enter the mobile number you used when signing up.');
      return;
    }

    setRecoveryLoading(true);
    try {
      await api.verifyPinRecovery({
        phone: recoveryPhone.trim(),
        email: user?.email,
      });
      setMode('reset');
      setResetStep(1);
      setFirstNewPin('');
      setPin('');
      setError('');
    } catch (e) {
      setRecoveryError(e.message || 'Could not verify. Check your number and internet.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const resetSubtitle =
    mode === 'reset'
      ? resetStep === 1
        ? 'Choose a new 6-digit PIN for SCARS.'
        : 'Enter the same PIN again.'
      : 'Enter your PIN to continue';

  if (mode === 'forgot') {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.top}>
          <View style={styles.logoWrap}>
            <MaterialCommunityIcons name="cellphone-key" size={36} color={colors.primary} />
          </View>
          <Text style={styles.appName}>Forgot PIN?</Text>
          <Text style={styles.subtitle}>
            Enter the mobile number on your account. It must match the number you used when you
            signed up.
          </Text>
        </View>

        <View style={styles.forgotForm}>
          <Text style={styles.fieldLabel}>Account email</Text>
          <Text style={styles.emailReadonly}>{user?.email || '—'}</Text>

          <Text style={styles.fieldLabel}>Mobile number</Text>
          <TextInput
            style={styles.phoneInput}
            value={recoveryPhone}
            onChangeText={setRecoveryPhone}
            keyboardType="phone-pad"
            placeholder="09171234567"
            placeholderTextColor={colors.textMuted}
            autoComplete="tel"
          />
          {recoveryError ? <Text style={styles.errorText}>{recoveryError}</Text> : null}

          <Pressable
            style={[styles.primaryBtn, recoveryLoading && styles.primaryBtnDisabled]}
            onPress={handleVerifyRecovery}
            disabled={recoveryLoading}
          >
            {recoveryLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Verify & reset PIN</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setMode('lock');
              setRecoveryError('');
              setRecoveryPhone('');
            }}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>Back to PIN</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const onKeyPress = mode === 'reset' ? handleResetKey : handleLockKey;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.logoWrap}>
          <MaterialCommunityIcons name="shield-lock-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.appName}>SCARS</Text>
        <Text style={styles.subtitle}>{resetSubtitle}</Text>
      </View>

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

      <View style={styles.errorWrap}>
        {cooldown > 0 && mode === 'lock' ? (
          <Text style={styles.errorText}>Too many attempts. Wait {cooldown}s.</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>

      <View style={styles.pad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.padRow}>
            {row.map((key) => {
              if (key === 'bio') {
                if (mode === 'reset') {
                  return <View key={key} style={[styles.key, styles.keyHidden]} />;
                }
                return (
                  <Pressable
                    key={key}
                    style={({ pressed }) => [
                      styles.key,
                      styles.keySpecial,
                      !biometricAvailable && styles.keyHidden,
                      pressed && styles.keyPressed,
                    ]}
                    onPress={() => onKeyPress('bio')}
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
                    onPress={() => onKeyPress('del')}
                    disabled={mode === 'lock' && cooldown > 0}
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
                    mode === 'lock' && cooldown > 0 && styles.keyDisabled,
                  ]}
                  onPress={() => onKeyPress(key)}
                  disabled={mode === 'lock' && cooldown > 0}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {mode === 'lock' ? (
        <Pressable
          onPress={() => {
            setMode('forgot');
            setRecoveryError('');
          }}
          style={styles.forgotLink}
        >
          <Text style={styles.forgotLinkText}>Forgot PIN?</Text>
        </Pressable>
      ) : null}
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
    paddingHorizontal: 28,
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
    textAlign: 'center',
    lineHeight: 20,
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
    minHeight: 22,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
  forgotLink: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  forgotLinkText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
  },
  forgotForm: {
    width: '100%',
    paddingHorizontal: 28,
    gap: 10,
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    marginTop: 8,
  },
  emailReadonly: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  phoneInput: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
});
