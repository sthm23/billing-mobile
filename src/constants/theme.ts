import '@/global.css';
import { Platform } from 'react-native';


export const Colors = {
    light: {
        text: '#161616',
        background: '#ffffff',
        primary: "#09090b",
        "primaryText": "#fafafa",
        secondary: "#f1f5f9",
        "secondaryText": "#475569",
        surface: "#f1f5f9",
        error: "#ef4444",
        border: "#e2e8f0",
        inputBorder: "#cbd5e1",
        white: "#ffffff",
        black: "#000000",
    },
    dark: {
        primary: "#ffffff",
        primaryText: "#18181b",
        secondary: "#27272a",
        secondaryText: "#d4d4d8",
        error: "#f87171",
        border: "#3f3f46",
        inputBorder: "#52525b",
        white: "#000000",
        text: "#ffffff",
        background: "#18181b",
        surface: "#09090b",
        black: "#ffffff",
    },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
    ios: {
        /** iOS `UIFontDescriptorSystemDesignDefault` */
        sans: 'system-ui',
        /** iOS `UIFontDescriptorSystemDesignSerif` */
        serif: 'ui-serif',
        /** iOS `UIFontDescriptorSystemDesignRounded` */
        rounded: 'ui-rounded',
        /** iOS `UIFontDescriptorSystemDesignMonospaced` */
        mono: 'ui-monospace',
    },
    default: {
        sans: 'normal',
        serif: 'serif',
        rounded: 'normal',
        mono: 'monospace',
    },
    web: {
        sans: 'var(--font-display)',
        serif: 'var(--font-serif)',
        rounded: 'var(--font-rounded)',
        mono: 'var(--font-mono)',
    },
});

export const Spacing = {
    half: 2,
    one: 4,
    two: 8,
    three: 16,
    four: 24,
    five: 32,
    six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

