import { useContext } from 'react';
import { useColorScheme } from 'react-native';

import { palette, type ThemeColors } from '@/constants/tokens';
import { ThemeControlContext } from '@/hooks/use-theme-control';

/**
 * Whether the app is in dark mode: the mode chosen in Profile (light / dark /
 * system), falling back to the OS scheme outside the theme provider. On web
 * the OS scheme ignores the in-app choice, so the context is the source.
 */
export function useIsDarkMode(): boolean {
  const control = useContext(ThemeControlContext);
  const systemScheme = useColorScheme();

  return control ? control.currentMode === 'dark' : systemScheme === 'dark';
}

/**
 * Hook to get STHM theme colors for the current color scheme.
 *
 * Use it only where className does not reach (navigator options, icon `color`
 * props, SVG). In components prefer Tailwind classes (`bg-card`, `text-ink`).
 */
export function useTheme(): ThemeColors {
  return useIsDarkMode() ? palette.dark : palette.light;
}
