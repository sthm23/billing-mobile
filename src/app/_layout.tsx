import '@/assets/i18next/i18next';
import { AuthProvider, AuthStatusEnum, useAuth } from '@/provider/AuthProvider';
import { ThemeProvider } from '@/provider/ThemeProvider';
import { Stack } from 'expo-router';
import { StatusBar } from "expo-status-bar";
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
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

  return (
        <ThemeProvider>
          <StatusBar  style={isDarkMode ? 'light' : 'dark'}/>
          <AuthProvider >
            <InitiallyLayout />
          </AuthProvider>
        </ThemeProvider>
    )
}
