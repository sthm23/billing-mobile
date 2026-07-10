import { Stack } from 'expo-router';
import { StatusBar } from "expo-status-bar";
// import { AnimatedSplashOverlay } from '@/components/animated-icon';
import '@/assets/i18next/i18next';
import { AuthProvider, useAuth } from '@/provider/AuthProvider';
import { ThemeProvider } from '@/provider/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import "../global.css";

const InitiallyLayout = () => {
const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

    return (
        <Stack >
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(tabs)" 
            options={{ title: "Tabs", headerShown: false }} />
          </Stack.Protected>

          <Stack.Protected guard={!isAuthenticated}>
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
