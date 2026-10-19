import { useColorScheme } from 'react-native';

import { palette } from '@/constants/tokens';

/**
 * Hook to get STHM theme colors for the current color scheme.
 *
 * Use it only where className does not reach (navigator options, icon `color`
 * props, SVG). In components prefer Tailwind classes (`bg-card`, `text-ink`).
 */
export function useTheme() {
  const isDark = useColorScheme() === 'dark';
  const t = isDark ? palette.dark : palette.light;

  return {
    ...t,

    // Legacy keys (pre-STHM) — remove once screens are migrated (stage 3).
    background: t.bg,
    surface: t.sunken,
    text: t.ink,
    textMuted: t.muted,
    foreground: t.ink,
    mutedForeground: t.muted,
    primaryForeground: t.onPrimary,
    secondary: t.sunken,
    secondaryForeground: t.ink,
    accentForeground: t.ink,
    border: t.line,
    input: t.line,
    destructive: t.errFg,
    success: t.okFg,
  };
}
