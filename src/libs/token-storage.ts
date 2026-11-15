import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { LOCALE_STORAGE_KEYS } from '@/models/app.models';

/**
 * Access token storage: Keychain / Keystore (expo-secure-store) on iOS and
 * Android. Expo web has no SecureStore, so the web build keeps AsyncStorage
 * (localStorage). The refresh token is never here — it is the httpOnly cookie.
 */
const KEY = LOCALE_STORAGE_KEYS.TOKEN;
const isWeb = Platform.OS === 'web';

export async function getAccessToken(): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(KEY);

  const token = await SecureStore.getItemAsync(KEY);
  if (token) return token;

  // One-time move of a token saved by an older app version (AsyncStorage)
  const legacy = await AsyncStorage.getItem(KEY);
  if (legacy) {
    await SecureStore.setItemAsync(KEY, legacy);
    await AsyncStorage.removeItem(KEY);
  }
  return legacy;
}

export async function setAccessToken(token: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(KEY, token);
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

export async function removeAccessToken(): Promise<void> {
  if (!isWeb) await SecureStore.deleteItemAsync(KEY);
  // Web token, or a legacy copy from an older app version
  await AsyncStorage.removeItem(KEY);
}
