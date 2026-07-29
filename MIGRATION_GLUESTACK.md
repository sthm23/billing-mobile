# GlueStack UI Theme Migration

## Overview
Migrated from custom theme provider to GlueStack UI theme management system.

## Changes Made

### 1. Theme Management
- **Removed**: Custom `ThemeProvider` from `src/provider/ThemeProvider.tsx`
- **Added**: New theme control system using GlueStack UI
  - `src/hooks/use-theme-control.ts` - Theme state management hook
  - Context-based theme provider integrated into `_layout.tsx`

### 2. Component Replacements
All custom themed components replaced with GlueStack UI components:

| Old Component | New Component | Import Path |
|--------------|---------------|-------------|
| `ThemedView` | `Box` | `@/components/ui/box` |
| `ThemedText` | `Text` | `@/components/ui/text` |

### 3. Updated Files
- ✅ `src/app/_layout.tsx` - Root layout with GlueStack provider
- ✅ `src/app/index.tsx` - Entry screen
- ✅ `src/app/(tabs)/(profile)/index.tsx` - Profile screen
- ✅ `src/app/(tabs)/(profile)/create.tsx` - Profile create
- ✅ `src/app/(tabs)/(profile)/settings.tsx` - Settings
- ✅ `src/app/(tabs)/(products)/index.tsx` - Products list
- ✅ `src/app/(tabs)/(products)/create.tsx` - Product create
- ✅ `src/app/(tabs)/(orders)/index.tsx` - Orders list
- ✅ `src/app/(tabs)/(orders)/create.tsx` - Order create
- ✅ `src/app/(tabs)/(payments)/index.tsx` - Payments list
- ✅ `src/app/(tabs)/(payments)/[id].tsx` - Payment details
- ✅ `src/app/(tabs)/(search)/scan.tsx` - Barcode scan
- ✅ `src/app/(tabs)/(search)/search.tsx` - Search screen
- ✅ `src/components/SelectTheme.tsx` - Theme selector
- ✅ `src/components/SelectLanguage.tsx` - Language selector

### 4. Removed Files
- ❌ `src/components/themed-view.tsx`
- ❌ `src/components/themed-text.tsx`
- ❌ `src/provider/ThemeProvider.tsx`

### 5. Updated Files (Compatibility)
- ✅ `src/hooks/use-theme.ts` - Recreated for backward compatibility with existing components
- ✅ `src/constants/theme.ts` - Cleaned up, removed old `Colors` object

## Theme System

### Theme Modes
Three modes are supported:
- `ThemeMode.LIGHT` - Light theme
- `ThemeMode.DARK` - Dark theme  
- `ThemeMode.AUTO` (system) - Follows system preference

### Usage

#### Managing Theme
```typescript
import { useThemeControl } from '@/hooks/use-theme-control';

function MyComponent() {
  const { themeMode, setThemeMode, currentMode } = useThemeControl();
  
  // Change theme
  await setThemeMode(ThemeMode.DARK);
}
```

#### Using Themed Components
```typescript
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

function MyComponent() {
  return (
    <Box className="bg-background p-4">
      <Text size="2xl" bold className="text-foreground">
        Hello World
      </Text>
    </Box>
  );
}
```

#### Legacy Color Access (Compatibility)
For components that need direct color values (icons, native components):
```typescript
import { useTheme } from '@/hooks/use-theme';

function MyComponent() {
  const colors = useTheme();
  
  return <Icon color={colors.text} />;
}
```

## Styling Guidelines

### Use Tailwind Classes
GlueStack components support Tailwind CSS via NativeWind. Dark mode is handled automatically:

```typescript
// ✅ Good - Automatic dark mode
<Box className="bg-background text-foreground">

// ❌ Old way - Manual dark mode variants
<Box className="bg-surface dark:bg-surface-dark">
```

### Text Sizes
Text component supports size variants:
- `size="2xl"` - Large titles (28px)
- `size="xl"` - Subtitles (24px)
- `size="lg"` - Large text (18px)
- `size="md"` - Default (16px)
- `size="sm"` - Small text (14px)
- `size="xs"` - Extra small (12px)

### Text Styles
Additional text styling props:
- `bold` - Bold font weight
- `italic` - Italic style
- `underline` - Underlined text
- `strikeThrough` - Strike-through text

## Benefits

1. **Consistent Theme Management**: Single source of truth for theme state
2. **Better Performance**: GlueStack optimized for React Native
3. **Auto Dark Mode**: Automatic color switching based on system preference
4. **Type Safety**: Better TypeScript support with GlueStack components
5. **Less Code**: No need for manual dark mode variants in every component
6. **Standard Approach**: Using industry-standard component library

## Migration Checklist

- ✅ Replace `ThemedView` with `Box`
- ✅ Replace `ThemedText` with `Text`
- ✅ Update theme provider in root layout
- ✅ Remove old theme files
- ✅ Update SelectTheme component
- ✅ Update SelectLanguage component
- ✅ Test theme switching
- ✅ Test all screens in light/dark mode
- ⏳ Run TypeScript compilation check
- ⏳ Test on iOS device
- ⏳ Test on Android device

## Notes

- Theme preference is persisted to AsyncStorage (`sthm23-theme-mode`)
- GlueStack UI provider handles color scheme changes automatically
- Old `useTheme` hook recreated for backward compatibility with icons and native tabs
- All theme colors defined in `global.css` using CSS variables
