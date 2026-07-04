import { Stack } from 'expo-router';
import { StatusBar } from "expo-status-bar";

// import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/provider/AuthProvider';
import { ThemeProvider } from '@/provider/ThemeProvider';
import { useColorScheme } from 'react-native';
import "../global.css";

const InitiallyLayout = () => {

  const { isAuthenticated } = useAuth();

    return (
        <Stack >
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(tabs)" 
            options={{ title: "Tabs", headerShown: false }} />
          </Stack.Protected>

          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="login" 
            options={{ title: "Login", headerShown: false }} />
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
