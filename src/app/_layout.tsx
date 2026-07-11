import { Stack } from 'expo-router';
import { StatusBar } from "expo-status-bar";
// import { AnimatedSplashOverlay } from '@/components/animated-icon';
import '@/assets/i18next/i18next';
import { LOCALE_STORAGE_KEYS } from '@/models/app.models';
import { AuthProvider, useAuth } from '@/provider/AuthProvider';
import { ThemeProvider } from '@/provider/ThemeProvider';
import { profileAuth } from '@/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import "../global.css";

const InitiallyLayout = () => {
const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      AsyncStorage.getItem(LOCALE_STORAGE_KEYS.USER).then((user) => {
        if (!user) {
          profileAuth().then(async res=>{
            console.log(res);
            await AsyncStorage.setItem(LOCALE_STORAGE_KEYS.USER, JSON.stringify(res));
          }).catch((error) => {
            console.error("Failed to fetch profile:", error);
          });
        }
      });
    }
  }, [isAuthenticated]);

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
