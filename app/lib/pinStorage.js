import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const STORE_PIN_LEGACY = 'scars_pin';
const STORE_PIN_HASH = 'scars_pin_hash';
const STORE_PIN_SALT = 'scars_pin_salt';
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

async function hashPin(pin, salt) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`
  );
}

async function ensureSalt() {
  let salt = await getItem(STORE_PIN_SALT);
  if (!salt) {
    salt = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Date.now()}-${Math.random()}`
    );
    await setItem(STORE_PIN_SALT, salt);
  }
  return salt;
}

export async function loadPinSettings() {
  const enabled = await getItem(STORE_PIN_ENABLED);
  return {
    pinEnabled: enabled === 'true',
  };
}

export async function savePin(pin) {
  const salt = await ensureSalt();
  const hash = await hashPin(pin, salt);
  await setItem(STORE_PIN_HASH, hash);
  await setItem(STORE_PIN_ENABLED, 'true');
  await removeItem(STORE_PIN_LEGACY);
}

export async function clearPin() {
  await removeItem(STORE_PIN_HASH);
  await removeItem(STORE_PIN_SALT);
  await removeItem(STORE_PIN_LEGACY);
  await setItem(STORE_PIN_ENABLED, 'false');
}

export async function verifyStoredPin(pin) {
  const salt = await getItem(STORE_PIN_SALT);
  const hash = await getItem(STORE_PIN_HASH);

  if (salt && hash) {
    const entered = await hashPin(pin, salt);
    return entered === hash;
  }

  const legacy = await getItem(STORE_PIN_LEGACY);
  if (legacy && legacy === pin) {
    await savePin(pin);
    return true;
  }

  return false;
}
