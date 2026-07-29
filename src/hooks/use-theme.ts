import { useColorScheme } from 'react-native';

/**
 * Hook to get theme colors based on current color scheme.
 * Returns color values compatible with GlueStack UI and NativeWind.
 *
 * Note: This hook is a legacy compatibility layer.
 * For new code, prefer using Tailwind classes directly with NativeWind.
 */
export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    // Background colors
    background: isDark ? '#0a0a0a' : '#ffffff',
    surface: isDark ? '#171717' : '#f5f5f5',
    card: isDark ? '#171717' : '#ffffff',

    // Text colors
    text: isDark ? '#fafafa' : '#0a0a0a',
    textMuted: isDark ? '#a1a1a1' : '#737373',

    // Primary colors
    primary: isDark ? '#fff5f5' : '#171717',
    primaryForeground: isDark ? '#171717' : '#fafafa',

    // Secondary colors
    secondary: isDark ? '#262626' : '#f5f5f5',
    secondaryForeground: isDark ? '#fafafa' : '#171717',

    // Border colors
    border: isDark ? '#2e2e2e' : '#e5e5e5',
    input: isDark ? '#2e2e2e' : '#e5e5e5',

    // Accent colors
    accent: isDark ? '#262626' : '#f7f7f7',
    accentForeground: isDark ? '#fafafa' : '#343434',

    // Status colors
    destructive: isDark ? '#ff6467' : '#e7000b',
    success: isDark ? '#86efac' : '#22c55e',
    muted: isDark ? '#262626' : '#f5f5f5',
  };
}
