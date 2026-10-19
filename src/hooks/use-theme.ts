import { useColorScheme } from 'react-native';

import { palette, type ThemeColors } from '@/constants/tokens';

/**
 * Hook to get STHM theme colors for the current color scheme.
 *
 * Use it only where className does not reach (navigator options, icon `color`
 * props, SVG). In components prefer Tailwind classes (`bg-card`, `text-ink`).
 */
export function useTheme(): ThemeColors {
  const isDark = useColorScheme() === 'dark';

  return isDark ? palette.dark : palette.light;
}
