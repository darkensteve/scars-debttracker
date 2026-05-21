import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const STORE_PIN = 'scars_pin';
const STORE_PIN_ENABLED = 'scars_pin_enabled';

async function setItem(key, value) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key) {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function loadPinSettings() {
  const enabled = await getItem(STORE_PIN_ENABLED);
  const pin = await getItem(STORE_PIN);
  return {
    pinEnabled: enabled === 'true',
    pin: pin || null,
  };
}

export async function savePin(pin) {
  await setItem(STORE_PIN, pin);
  await setItem(STORE_PIN_ENABLED, 'true');
}

export async function clearPin() {
  await removeItem(STORE_PIN);
  await setItem(STORE_PIN_ENABLED, 'false');
}

export async function verifyStoredPin(pin) {
  const stored = await getItem(STORE_PIN);
  return stored === pin;
}
