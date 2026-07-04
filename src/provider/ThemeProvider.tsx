import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

export enum ThemeMode {
    LIGHT = 'light',
    DARK = 'dark',
    AUTO = 'auto',
}

export enum ThemeStorageKey {
    THEME_MODE = 'sthm23-theme-mode',
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(ThemeMode.AUTO);
  const [isLoading, setIsLoading] = useState(true);
  const {setColorScheme} = useColorScheme();

  useEffect(() => {
    loadThemeMode();
  }, []);

  async function loadThemeMode() {
    try {
      const saved = await AsyncStorage.getItem(ThemeStorageKey.THEME_MODE) as ThemeMode | null;
      if (saved) {
        setThemeModeState(saved);
        setColorScheme(saved === ThemeMode.AUTO ? 'system' : saved);
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function setThemeMode(mode: ThemeMode) {
    try {
      setThemeModeState(mode);
      setColorScheme(mode=== ThemeMode.AUTO ? 'system' : mode);
      await AsyncStorage.setItem(ThemeStorageKey.THEME_MODE, mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {isLoading ? null : children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return context;
}