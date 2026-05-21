import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PIN_LENGTH = 6;

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

export default function PinSetupScreen({ navigation, route }) {
  const { savePin } = useAuth();
  const insets = useSafeAreaInsets();
  const isChanging = route?.params?.isChanging;

  const [step, setStep] = useState(1); // 1 = enter, 2 = confirm
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;

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

  const handleKey = useCallback(async (key) => {
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
      setError('');
      return;
    }
    if (key === '') return;

    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      if (step === 1) {
        setFirstPin(newPin);
        setPin('');
        setError('');
        setStep(2);
      } else {
        if (newPin === firstPin) {
          await savePin(newPin);
          navigation.goBack();
        } else {
          shake();
          setError("PINs don't match. Try again.");
          setPin('');
          setStep(1);
          setFirstPin('');
        }
      }
    }
  }, [pin, step, firstPin, savePin, navigation, shake]);

  const stepLabel = step === 1
    ? isChanging ? 'Enter your new PIN' : 'Create a 6-digit PIN'
    : 'Confirm your PIN';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.top}>
        <View style={styles.logoWrap}>
          <MaterialCommunityIcons
            name={step === 1 ? 'lock-plus-outline' : 'lock-check-outline'}
            size={32}
            color={colors.primary}
          />
        </View>
        <Text style={styles.title}>{stepLabel}</Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? 'This PIN will be required every time you open the app.'
            : 'Re-enter the same PIN to confirm.'}
        </Text>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>
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

      {/* Error */}
      <View style={styles.errorWrap}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {/* Number pad */}
      <View style={styles.pad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.padRow}>
            {row.map((key, ki) => {
              if (key === 'del') {
                return (
                  <Pressable
                    key={ki}
                    style={({ pressed }) => [styles.key, styles.keySpecial, pressed && styles.keyPressed]}
                    onPress={() => handleKey('del')}
                  >
                    <MaterialCommunityIcons
                      name="backspace-outline"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                );
              }
              if (key === '') {
                return <View key={ki} style={[styles.key, styles.keyHidden]} />;
              }
              return (
                <Pressable
                  key={ki}
                  style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                  onPress={() => handleKey(key)}
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
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginTop: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
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
  keyHidden: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyPressed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  keyText: {
    fontSize: 24,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
  },
});
