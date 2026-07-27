import '@/assets/i18next/i18next';
import { AuthProvider, AuthStatusEnum, useAuth } from '@/provider/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Stack } from 'expo-router';
import { StatusBar } from "expo-status-bar";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { ThemeProvider } from '@/provider/ThemeProvider';
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
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;
  const isDarkMode = theme === 'dark'

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

  return (
    <GluestackUIProvider mode={isDarkMode ? 'dark' : 'light'}>
      <ThemeProvider>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AuthProvider >
          <QueryClientProvider client={queryClient}>
            <InitiallyLayout />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </GluestackUIProvider>
  )
}
