/**
 * STHM design tokens — JS mirror of `src/global.css`.
 *
 * Source: STHM design system (tokens.json). Light and dark themes share the
 * same token names; only the values change.
 *
 * Use Tailwind classes (`bg-card`, `text-ink`, …) in components. Use these
 * values only where className does not reach: navigator options, icon `color`
 * props, SVG fills, Reanimated styles.
 *
 * Keep in sync with the `:root` blocks in `src/global.css`.
 */

export const palette = {
  light: {
    bg: '#F2F2EF',
    card: '#FFFFFF',
    sunken: '#F2F2EF',
    ink: '#141414',
    soft: '#55554F',
    muted: '#6B6B66',
    line: '#F0F0EB',
    primary: '#141414',
    onPrimary: '#FFFFFF',
    accent: '#B7C9A0',
    onAccent: '#141414',
    hero: '#141414',
    heroInk: '#FFFFFF',
    heroSub: '#262624',
    heroMuted: '#B5B5AE',
    heroLine: '#2E2E2B',
    heroErr: '#FF9B8F',
    heroWarn: '#F0C36B',
    nav: '#141414',
    navInk: '#FFFFFF',
    navMuted: '#9A9A93',
    okBg: '#E3F3DF',
    okFg: '#1F6B35',
    errBg: '#FCE6E2',
    errFg: '#B42318',
    warnBg: '#FDF0D5',
    warnFg: '#8A5300',
    infoBg: '#E3EBFC',
    infoFg: '#2650B8',
    phBg: '#EDEDE8',
    phFg: '#8A8A83',
    track: '#E6E6E0',
    seg: '#FFFFFF',
    disabledBg: '#E6E6E0',
    disabledFg: '#8A8A83',
    scrim: 'rgba(20, 20, 20, 0.55)',
  },
  dark: {
    bg: '#0F0F0E',
    card: '#1B1B19',
    sunken: '#262624',
    ink: '#F2F2EF',
    soft: '#B5B5AE',
    muted: '#A3A39C',
    line: '#2A2A27',
    primary: '#F2F2EF',
    onPrimary: '#141414',
    accent: '#B7C9A0',
    onAccent: '#141414',
    hero: '#262624',
    heroInk: '#F2F2EF',
    heroSub: '#33332F',
    heroMuted: '#A3A39C',
    heroLine: '#3A3A37',
    heroErr: '#FF9B8F',
    heroWarn: '#F0C36B',
    nav: '#262624',
    navInk: '#F2F2EF',
    navMuted: '#8E8E87',
    okBg: '#1E3324',
    okFg: '#8FD49E',
    errBg: '#3A1E1B',
    errFg: '#FF9B8F',
    warnBg: '#3A2E14',
    warnFg: '#F0C36B',
    infoBg: '#1C2840',
    infoFg: '#9DB8F5',
    phBg: '#262624',
    phFg: '#77776F',
    track: '#1B1B19',
    seg: '#3A3A37',
    disabledBg: '#262624',
    disabledFg: '#6B6B66',
    scrim: 'rgba(0, 0, 0, 0.7)',
  },
} as const;

export type ThemeName = keyof typeof palette;
export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };

/** Onest faces loaded in the root layout; one family per weight. */
export const FontFamily = {
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  semibold: 'Onest_600SemiBold',
  bold: 'Onest_700Bold',
} as const;
