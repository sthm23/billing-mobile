# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **mobile application** for a multi-platform retail billing system built with Expo and React Native. It connects to the backend API (`billing/`) to manage retail operations including orders, payments, products, and customer interactions.

**Key Technologies:**
- **Expo SDK 56** (React Native 0.85.3, React 19.2.3)
- **Expo Router v56** — File-based routing with typed routes
- **NativeWind v4** — Tailwind CSS for React Native
- **@expo/ui** — Native UI components (SwiftUI/Jetpack Compose)
- **React Query** — Data fetching and caching
- **React Hook Form + Zod** — Form validation
- **i18next** — Internationalization (English, Russian, Uzbek)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start                    # Open Expo dev tools
npx expo start               # Same as npm start
npm run android              # Run on Android emulator
npm run ios                  # Run on iOS simulator
npm run web                  # Run in web browser

# Linting
npm run lint                 # ESLint check

# Project reset (for starting fresh)
npm run reset-project        # Move starter code to app-example/
```

## Important: Expo Documentation

**CRITICAL**: Always reference **versioned** Expo documentation at https://docs.expo.dev/versions/v56.0.0/

Expo changes significantly between versions. Do NOT use unversioned docs or assume patterns from other versions work in v56.

## Architecture

### File-Based Routing

The app uses Expo Router's file-based routing with typed routes enabled:

```
src/app/
├── _layout.tsx              # Root layout (providers, auth routing)
├── index.tsx                # Redirect/entry point
├── login.tsx                # Login screen (unauth only)
└── (tabs)/                  # Main authenticated app
    ├── _layout.tsx          # NativeTabs bottom navigation
    ├── (products)/          # Product management stack
    ├── (orders)/            # Order creation/viewing stack
    ├── (search)/            # Search & barcode scanning
    ├── (payments)/          # Payment/cashbox management
    └── (profile)/           # User profile & settings
```

**Route Groups**: Directories wrapped in `()` don't appear in the URL path but organize related screens and create nested layouts.

### Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:

```typescript
@/*           // src/*
@/assets/*    // assets/*
```

Always use these aliases for imports:
```typescript
import { Button } from '@/components/ui/button';
import { useAuth } from '@/provider/AuthProvider';
import en from '@/assets/i18next/locales/en';
```

### Key Directories

```
src/
├── api/                   # Axios instances & API configuration
│   └── axios-instance.ts  # Auth interceptors, token refresh logic
├── app/                   # Expo Router screens (file-based routing)
├── assets/                # Static assets (moved from root)
│   └── i18next/           # Translation files (en, ru, uz)
├── components/            # Reusable UI components
│   └── ui/                # Base UI components (button, input, etc.)
├── constants/             # App constants (theme, colors)
├── hooks/                 # Custom React hooks
├── icons/                 # Custom icon components
├── libs/                  # Utility functions (cn, etc.)
├── models/                # TypeScript interfaces/types
├── provider/              # React Context providers
└── services/              # API service layer
```

## Authentication Flow

**Stack.Protected** guards in `_layout.tsx` handle route protection:

```typescript
<Stack.Protected guard={isAuthenticated}>
  <Stack.Screen name="(tabs)" />  {/* Authenticated routes */}
</Stack.Protected>

<Stack.Protected guard={!isAuthenticated}>
  <Stack.Screen name="login" />    {/* Public routes */}
</Stack.Protected>
```

**Token Management:**
- Access token stored in AsyncStorage (`LOCALE_STORAGE_KEYS.TOKEN`)
- Automatic refresh via axios interceptor in `axios-instance.ts`
- On 401 response: attempts token refresh, retries request, or logs out
- User profile fetched on login and stored locally

**Auth Providers:**
- `AuthProvider` — Manages authentication state, login/logout
- `ThemeProvider` — Theme mode (light/dark/auto) persistence

## API Integration

### Axios Configuration

Base URL configured in `src/api/axios-instance.ts`:

```typescript
// Platform-specific base URLs
const BASE_URL = Platform.select({
  ios: 'https://sthm23.uz/api',
  android: 'https://sthm23.uz/api',
  default: 'https://sthm23.uz/api',
})
```

**Available API Instances:**
- `api` — General API calls
- `usersApi` — User endpoints
- `ordersApi` — Order endpoints
- `productsApi` — Product endpoints
- `paymentsApi` — Payment/cashbox endpoints

**Request Flow:**
1. Interceptor adds `Authorization: Bearer <token>` header
2. On 401 error: automatic token refresh attempt
3. Retry original request with new token
4. If refresh fails: logout and clear session

### API Models

TypeScript interfaces in `src/models/`:
- `auth.model.ts` — Auth types (AuthRequest, AuthResponse, CurrentUserType)
- `user.model.ts` — User, Staff, Customer types
- `order.model.ts` — Order, OrderItem types
- `product.model.ts` — Product, ProductVariant types
- `payment.model.ts` — Payment, CashTransaction types
- `store.model.ts` — Store, Warehouse types

Always import and use these types for type safety with API responses.

## Styling with NativeWind

**NativeWind v4** provides Tailwind CSS utilities for React Native. Configuration in `tailwind.config.js`.

### Theme System

**Dual theme support** with light/dark variants defined in `tailwind.config.js` and `src/constants/theme.ts`:

```typescript
// Use Tailwind classes with dark: prefix
<View className="bg-background dark:bg-background-dark">
  <Text className="text-text dark:text-text-dark">Hello</Text>
</View>
```

**Theme Colors:**
- Light: `background`, `text`, `primary`, `secondary`, `surface`, `error`, `success`, `border`
- Dark: `background-dark`, `text-dark`, `primary-dark`, etc.

**Theme Mode:**
- Managed by `ThemeProvider` and `useThemeMode()` hook
- Options: `ThemeMode.LIGHT`, `ThemeMode.DARK`, `ThemeMode.AUTO`
- Persisted to AsyncStorage (`sthm23-theme-mode`)

### Utility Function

Use `cn()` helper from `src/libs/utils.ts` to merge Tailwind classes:

```typescript
import { cn } from '@/libs/utils';

<Button className={cn('bg-primary', isActive && 'bg-error')} />
```

## Internationalization (i18n)

**react-i18next** with three languages: English (en), Russian (ru), Uzbek (uz).

**Setup:**
- Translation files: `assets/i18next/locales/{en,ru,uz}.ts`
- Initialized in `assets/i18next/i18next.ts`
- Loaded in `_layout.tsx` before app renders

**Usage:**
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <Text>{t('navigation.products')}</Text>;
}
```

**Language Management:**
- `AppLanguage` enum: `AUTO`, `EN`, `RU`, `UZ`
- `setAppLanguage(language)` — Change language and persist
- `getSavedLanguageOption()` — Retrieve saved preference
- Auto-detection based on device locale if set to `AUTO`
- Default fallback: Uzbek (`uz`)

## UI Components

### Base Components

Custom UI components in `src/components/ui/`:

**Button** (`ui/button.tsx`):
```typescript
<Button 
  variant="default" | "error" | "outline" | "secondary" | "ghost" | "link"
  size="default" | "sm" | "lg" | "icon"
  loading={false}
  disabled={false}
>
  Press me
</Button>
```

**Input** (`ui/input.tsx`):
- Text input with dark mode support

**IconSelect** (`ui/icon-select.tsx`):
- Native icon picker component

### Themed Components

**ThemedView** and **ThemedText** (`themed-view.tsx`, `themed-text.tsx`):
- Automatically adapt to current theme
- Type prop for semantic variants (e.g., `type="surface"`, `type="title"`)

### @expo/ui Components

Limited usage of `@expo/ui` native components. Used in:
- `SelectTheme.tsx`
- `SelectLanguage.tsx`
- `icon-select.tsx`

When using `@expo/ui`, ensure you're using v56-compatible patterns from versioned docs.

## Native Tabs Navigation

Bottom tab navigation using **NativeTabs** (from `expo-router/unstable-native-tabs`):

```typescript
<NativeTabs
  backgroundColor={colors.background}
  indicatorColor={colors.surface}
  labelStyle={{ selected: { color: colors.text } }}
>
  <NativeTabs.Trigger name="(products)">
    <NativeTabs.Trigger.Label>{t('navigation.products')}</NativeTabs.Trigger.Label>
    <NativeTabs.Trigger.Icon md='list' sf='list.bullet' />
  </NativeTabs.Trigger>
  {/* More tabs... */}
</NativeTabs>
```

**Tab Routes:**
- `(products)` — Product list/create
- `(orders)` — Order list/create
- `(search)` — Search & barcode scan
- `(payments)` — Payment history & cashbox
- `(profile)` — User settings & profile

## Configuration Files

### app.json

Expo app configuration with:
- **Plugins**: `expo-router`, `expo-splash-screen`, `expo-localization`
- **Experiments**: `typedRoutes: true`, `reactCompiler: true`
- **Scheme**: `billingmobile://` for deep linking

### metro.config.js

Metro bundler configured with NativeWind:
```javascript
const { withNativeWind } = require('nativewind/metro');
module.exports = withNativeWind(config, { input: './src/global.css' });
```

### babel.config.js

Babel preset with NativeWind JSX runtime:
```javascript
presets: [
  ["babel-preset-expo", { jsxImportSource: "nativewind" }],
  "nativewind/babel",
]
```

## Important Notes

### Expo SDK Version

Always use Expo SDK 56 patterns and APIs. When searching for solutions:
- Check versioned docs: https://docs.expo.dev/versions/v56.0.0/
- Verify package versions match `package.json` dependencies
- Expo changes rapidly between versions; v55 patterns may not work in v56

### Platform Differences

Test on both iOS and Android:
- UI components may render differently
- Icon names differ (`md='icon'` for Android/Material, `sf='icon'` for iOS/SF Symbols)
- Network behavior differs (use Platform.select for URLs)

### Development Workflow

1. Use `npx expo start` to launch dev server
2. Scan QR code with Expo Go app OR
3. Press `a` for Android emulator, `i` for iOS simulator
4. Hot reload enabled by default (save to reload)
5. Shake device to open developer menu

### Path Structure

- All source code in `src/` directory
- Assets imported from `assets/` (icons, images, translations)
- Use `@/` alias for clean imports from `src/`
- Route files MUST be in `src/app/` for Expo Router

### AsyncStorage Keys

Defined in `src/models/app.models.ts`:
```typescript
LOCALE_STORAGE_KEYS = {
  TOKEN: 'sthm23-auth-token',
  USER: 'sthm23-user-profile',
}
```

Additional keys:
- `sthm23-theme-mode` — Theme preference
- `sthm23_app-language` — Language preference

### State Management

- **React Context**: Auth, Theme providers
- **React Query**: API data fetching/caching
- **AsyncStorage**: Persistent local storage
- **React Hook Form**: Form state management

## Common Patterns

### Protected API Call

```typescript
import { api } from '@/api/axios-instance';

async function fetchData() {
  const response = await api.get('/endpoint');
  return response.data;
}
```

### Form with Validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
});

function MyForm() {
  const { handleSubmit, control } = useForm({
    resolver: zodResolver(schema),
  });
  
  const onSubmit = (data) => {
    // Handle form submission
  };
  
  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

### Themed Component

```typescript
import { useTheme } from '@/hooks/use-theme';

function MyComponent() {
  const colors = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Content</Text>
    </View>
  );
}
```

### Navigation

```typescript
import { router } from 'expo-router';

// Navigate to route
router.push('/(tabs)/(products)/create');

// Go back
router.back();

// Replace current route
router.replace('/login');
```

## Testing Considerations

- Unit testing not yet configured (see Expo docs for Jest setup)
- Manual testing via Expo dev client on physical devices recommended
- Test auth flows (login, logout, token refresh)
- Test both light and dark themes
- Test all three languages (en, ru, uz)
- Verify offline behavior (AsyncStorage persistence)
