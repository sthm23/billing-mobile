import '@/assets/i18next/i18next';
import { AuthProvider, AuthStatusEnum, useAuth } from '@/provider/AuthProvider';
import {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  useFonts,
} from '@expo-google-fonts/onest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  ThemeControlContext,
  ThemeMode,
  applyThemeMode,
  loadThemeMode,
  saveThemeMode,
} from '@/hooks/use-theme-control';
import "../global.css";

// Keep the native splash until fonts and the saved theme are ready.
SplashScreen.preventAutoHideAsync();

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
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
  });
  // On font error fall back to the system font instead of blocking the app.
  const isFontReady = fontsLoaded || fontError !== null;

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
      applyThemeMode(savedMode);
      setIsThemeLoaded(true);
    }
    initTheme();
  }, []);

  useEffect(() => {
    if (isThemeLoaded && isFontReady) {
      SplashScreen.hideAsync();
    }
  }, [isThemeLoaded, isFontReady]);

  // Apply theme when it changes
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    applyThemeMode(mode);
    await saveThemeMode(mode);
  };

  // Determine if dark mode is active for StatusBar
  const isDarkMode =
    themeMode === ThemeMode.DARK ||
    (themeMode === ThemeMode.AUTO && systemScheme === 'dark');

  if (!isThemeLoaded || !isFontReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeControlContext.Provider value={{ themeMode, setThemeMode }}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AuthProvider >
          <QueryClientProvider client={queryClient}>
            <InitiallyLayout />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeControlContext.Provider>
    </GestureHandlerRootView>
  )
}
