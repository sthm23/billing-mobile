import '@/assets/i18next/i18next';
import { AuthProvider, AuthStatusEnum, useAuth } from '@/provider/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Stack } from 'expo-router';
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import {
  ThemeControlContext,
  ThemeMode,
  loadThemeMode,
  saveThemeMode,
  getModeForGlueStack,
  applyThemeMode,
  type ModeType
} from '@/hooks/use-theme-control';
import "../global.css";

const InitiallyLayout = () => {
  const { t } = useTranslation();
  const { authStatus, isAuthenticated } = useAuth();

  if (authStatus === AuthStatusEnum.Loading) {
    return null;
  }

  return (
    <Stack >
      <Stack.Protected guard={authStatus === AuthStatusEnum.Authenticated && isAuthenticated}>
        <Stack.Screen name="(tabs)"
          options={{ title: "Tabs", headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={authStatus === AuthStatusEnum.Unauthenticated && !isAuthenticated}>
        <Stack.Screen name="login"
          options={{ title: t('login.loginButton'), headerShown: false }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(ThemeMode.AUTO);
  const [currentMode, setCurrentMode] = useState<ModeType>('system');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error): boolean => {
              if (isAxiosError(error) && error.response && error.response.status < 500) {
                return false
              }

              return failureCount < 2
            },
          },
        },
      })
  );

  // Load saved theme on mount
  useEffect(() => {
    async function initTheme() {
      const savedMode = await loadThemeMode();
      setThemeModeState(savedMode);
      const glueStackMode = getModeForGlueStack(savedMode);
      setCurrentMode(glueStackMode);
      applyThemeMode(savedMode);
      setIsThemeLoaded(true);
    }
    initTheme();
  }, []);

  // Apply theme when it changes
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    const glueStackMode = getModeForGlueStack(mode);
    setCurrentMode(glueStackMode);
    applyThemeMode(mode);
    await saveThemeMode(mode);
  };

  // Determine if dark mode is active for StatusBar
  const isDarkMode =
    currentMode === 'dark' ||
    (currentMode === 'system' && systemScheme === 'dark');

  if (!isThemeLoaded) {
    return null;
  }

  return (
    <GluestackUIProvider mode={currentMode}>
      <ThemeControlContext.Provider value={{ themeMode, setThemeMode, currentMode }}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AuthProvider >
          <QueryClientProvider client={queryClient}>
            <InitiallyLayout />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeControlContext.Provider>
    </GluestackUIProvider>
  )
}
