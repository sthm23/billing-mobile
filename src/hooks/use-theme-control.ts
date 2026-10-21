import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform } from 'react-native';
import { createContext, useContext } from 'react';

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'system',
}

export enum ThemeStorageKey {
  THEME_MODE = 'sthm23-theme-mode',
}

export type ModeType = 'light' | 'dark' | 'system';

export interface ThemeControlContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  currentMode: ModeType;
}

export const ThemeControlContext = createContext<ThemeControlContextType | undefined>(undefined);

export function useThemeControl() {
  const context = useContext(ThemeControlContext);
  if (!context) {
    throw new Error('useThemeControl must be used within ThemeControlProvider');
  }
  return context;
}

export async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const saved = await AsyncStorage.getItem(ThemeStorageKey.THEME_MODE) as ThemeMode | null;
    return saved || ThemeMode.AUTO;
  } catch (error) {
    console.error('Failed to load theme mode:', error);
    return ThemeMode.AUTO;
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(ThemeStorageKey.THEME_MODE, mode);
  } catch (error) {
    console.error('Failed to save theme mode:', error);
  }
}

export function getModeForGlueStack(themeMode: ThemeMode): ModeType {
  if (themeMode === ThemeMode.AUTO) {
    return ThemeMode.AUTO;
  }
  return themeMode as ModeType;
}

export function applyThemeMode(mode: ThemeMode): void {
  if (Platform.OS === 'web') {
    // react-native-web has no Appearance.setColorScheme: global.css switches the
    // tokens by a `dark` / `light` class on <html>; no class = follow the system.
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove(ThemeMode.DARK, ThemeMode.LIGHT);
      if (mode !== ThemeMode.AUTO) root.classList.add(mode);
    }
    return;
  }
  // 'unspecified' hands the scheme back to the system (after a forced light/dark).
  Appearance.setColorScheme(mode === ThemeMode.AUTO ? 'unspecified' : mode);
}
