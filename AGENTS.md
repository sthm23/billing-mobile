# Billing Mobile — Expo + React Native App

> **Context**: Mobile application for my-billing retail POS system

---

## ⚠️ CRITICAL: Expo Documentation

**ALWAYS use versioned Expo documentation**:
👉 https://docs.expo.dev/versions/v56.0.0/

Expo changes significantly between versions. Do NOT use:
- ❌ Unversioned docs (docs.expo.dev without `/versions/`)
- ❌ Patterns from other Expo versions (v54, v55)
- ❌ Stack Overflow answers without checking Expo version

**When searching for solutions**:
1. Verify Expo SDK version in `package.json` → currently **v56**
2. Use versioned docs link above
3. Check package versions match `package.json` dependencies

---

## Technology Stack

- **Expo SDK**: 56.0.0
- **React Native**: 0.85.3
- **React**: 19.2.3
- **Expo Router**: v56 (file-based routing with typed routes)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **UI**: @expo/ui (icons), custom base components, @react-native-picker/picker
- **Data Fetching**: React Query
- **Forms**: React Hook Form + Zod validation
- **i18n**: i18next (en, ru, uz)
- **Networking**: Axios with interceptors
- **Storage**: AsyncStorage

---

## Responsibility

This application provides the **mobile user interface** for the billing system.

**What mobile does**:
- Display data from backend API
- Handle user interactions (touch, swipe, scan)
- Barcode scanning via Expo Camera
- Client-side validation (UX only)
- Manage local state and cache
- Offline-first features (planned)

**What mobile does NOT do**:
- Implement business logic (backend's responsibility)
- Calculate stock, prices, totals independently
- Make direct database calls

---

## File Structure

```
src/
├── api/                          # Axios configuration
│   └── axios-instance.ts         # Auth interceptors, token refresh
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Entry point (redirect)
│   ├── login.tsx                 # Login screen (public)
│   └── (tabs)/                   # Main authenticated app
│       ├── _layout.tsx           # Bottom tab navigation
│       ├── (products)/           # Product management
│       ├── (orders)/             # Order creation/viewing
│       ├── (search)/             # Search & barcode scan
│       ├── (payments)/           # Payment/cashbox
│       └── (profile)/            # User settings
├── assets/                       # Static assets (moved from root)
│   └── i18next/                  # Translation files
├── components/                   # Reusable UI components
│   └── ui/                       # Base UI (button, input, etc.)
├── constants/                    # App constants (theme, colors)
├── hooks/                        # Custom React hooks
├── icons/                        # Custom icon components
├── libs/                         # Utility functions (cn, etc.)
├── models/                       # TypeScript interfaces
├── provider/                     # React Context providers
└── services/                     # API service layer
```

---

## Expo Router (File-Based Routing)

**CRITICAL**: Routes are determined by file structure in `src/app/`.

### Route Groups

Directories wrapped in `()` don't appear in the URL but organize screens and create layouts.

**Example**:
```
app/
├── _layout.tsx              # Root layout
├── login.tsx                # Route: /login
├── (tabs)/                  # Group (not in URL)
│   ├── _layout.tsx          # Tab navigation layout
│   ├── (products)/          # Group
│   │   ├── index.tsx        # Route: /(tabs)/(products)
│   │   └── create.tsx       # Route: /(tabs)/(products)/create
│   └── (orders)/
│       ├── index.tsx        # Route: /(tabs)/(orders)
│       └── [id].tsx         # Route: /(tabs)/(orders)/[id] (dynamic)
```

---

### Navigation

**Import**:
```typescript
import { router } from 'expo-router';
```

**Navigate**:
```typescript
// Push new screen
router.push('/(tabs)/(products)/create');

// Go back
router.back();

// Replace current screen
router.replace('/login');

// Navigate with params
router.push({
  pathname: '/(tabs)/(orders)/[id]',
  params: { id: '123' }
});
```

**Get params in component**:
```typescript
import { useLocalSearchParams } from 'expo-router';

function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Use id...
}
```

---

## Path Aliases

Configured in `tsconfig.json`:

```typescript
@/*           // src/*
@/assets/*    // assets/*
```

**Always use path aliases**:
```typescript
import { Button } from '@/components/base/button';
import { useAuth } from '@/provider/AuthProvider';
import { api } from '@/api/axios-instance';
```

---

## Authentication Flow

### Stack.Protected Guards

In `app/_layout.tsx`:

```typescript
<Stack.Protected guard={isAuthenticated}>
  <Stack.Screen name="(tabs)" />  {/* Authenticated routes */}
</Stack.Protected>

<Stack.Protected guard={!isAuthenticated}>
  <Stack.Screen name="login" />    {/* Public routes */}
</Stack.Protected>
```

### Token Management

**Access Token**:
- Stored in AsyncStorage (`LOCALE_STORAGE_KEYS.TOKEN`)
- Sent in `Authorization: Bearer <token>` header
- Valid for 15 minutes

**Refresh Token**:
- Stored in httpOnly cookie (managed by backend)
- Used to get new access token when expired

**Auto-Refresh** (`axios-instance.ts`):
```typescript
// On 401 response
if (error.response?.status === 401) {
  // Attempt token refresh
  const newToken = await refreshAccessToken();
  // Retry original request with new token
  // If refresh fails → logout
}
```

---

## API Communication

### Base URL

Configured in `src/api/axios-instance.ts`:

```typescript
const BASE_URL = Platform.select({
  ios: 'https://sthm23.uz/api',
  android: 'https://sthm23.uz/api',
  default: 'https://sthm23.uz/api',
});
```

### API Instances

```typescript
import { api } from '@/api/axios-instance';

// General API calls
const response = await api.get('/order');

// Specific instances (if available)
import { ordersApi, productsApi, paymentsApi } from '@/api/axios-instance';
```

### Request Pattern

```typescript
async function fetchOrders() {
  try {
    const response = await api.get<Order[]>('/order', {
      params: { storeId: '123', status: 'DEBT' }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
}
```

---

## Styling with NativeWind

**NativeWind v4** provides Tailwind CSS utilities for React Native.

### Theme System

**Dual theme** (light/dark) with automatic mode detection.

**Usage**:
```tsx
<View className="bg-background dark:bg-background-dark p-4">
  <Text className="text-text dark:text-text-dark text-lg">
    Hello World
  </Text>
</View>
```

**Theme Colors** (from `tailwind.config.js`):
```typescript
// Light mode
background, text, primary, secondary, surface, error, success, border

// Dark mode
background-dark, text-dark, primary-dark, secondary-dark, etc.
```

### Utility Function

```typescript
import { cn } from '@/libs/utils';

<Button className={cn('bg-primary', isActive && 'bg-error')} />
```

---

## UI Components

### Base Components (`components/base/`)

**Button**:
```tsx
import { Button } from '@/components/base/button';

<Button
  variant="default" | "error" | "outline" | "secondary" | "ghost" | "link"
  size="default" | "sm" | "lg" | "icon"
  loading={false}
  disabled={false}
  onPress={() => console.log('Pressed')}
>
  Press me
</Button>
```

**Input**:
```tsx
import { Input } from '@/components/base/input';

<Input
  placeholder="Enter text"
  value={text}
  onChangeText={setText}
/>
```

**Select** (Native Picker):
```tsx
import { Select } from '@/components/base';

<Select
  variant="outline" | "underlined" | "rounded"
  size="sm" | "md" | "lg"
  selectedValue={value}
  onValueChange={setValue}
  disabled={false}
>
  <Select.Item label="Option 1" value="opt1" />
  <Select.Item label="Option 2" value="opt2" />
</Select>
```

**IMPORTANT**: Select uses native `@react-native-picker/picker`:
- **Android**: Shows dropdown menu
- **iOS**: Shows wheel picker at bottom

**Example with dynamic options**:
```tsx
<Select
  variant="outline"
  size="md"
  selectedValue={selectedCategory}
  onValueChange={setSelectedCategory}
>
  {categories.map((cat) => (
    <Select.Item
      key={cat.id}
      label={cat.name}
      value={cat.id}
    />
  ))}
</Select>
```

### Themed Components

**ThemedView** and **ThemedText** automatically adapt to current theme:
```tsx
import { ThemedView, ThemedText } from '@/components/themed-view';

<ThemedView type="surface">
  <ThemedText type="title">Title</ThemedText>
</ThemedView>
```

---

## Native Tabs Navigation

Bottom tab navigation using **NativeTabs** (from `expo-router/unstable-native-tabs`):

```tsx
import { NativeTabs } from 'expo-router/unstable-native-tabs';

<NativeTabs
  backgroundColor={colors.background}
  indicatorColor={colors.surface}
>
  <NativeTabs.Trigger name="(products)">
    <NativeTabs.Trigger.Label>Products</NativeTabs.Trigger.Label>
    <NativeTabs.Trigger.Icon md='list' sf='list.bullet' />
  </NativeTabs.Trigger>
  {/* More tabs... */}
</NativeTabs>
```

**Tab Routes**:
- `(products)` — Product list/create
- `(orders)` — Order list/create
- `(search)` — Search & barcode scan
- `(payments)` — Payment history & cashbox
- `(profile)` — User settings

**Icons**:
- `md='icon'` — Material Design (Android)
- `sf='icon'` — SF Symbols (iOS)

---

## Internationalization (i18n)

**i18next** with 3 languages: English (en), Russian (ru), Uzbek (uz).

**Setup**:
- Translation files: `assets/i18next/locales/{en,ru,uz}.ts`
- Initialized: `assets/i18next/i18next.ts`
- Loaded before app renders in `_layout.tsx`

**Usage**:
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('navigation.products')}</Text>
      <Text>{t('order.status.DEBT')}</Text>
    </View>
  );
}
```

**Language Management**:
```typescript
import { setAppLanguage, AppLanguage } from '@/assets/i18next/i18next';

// Change language
setAppLanguage(AppLanguage.EN);  // 'en', 'ru', 'uz', 'auto'
```

---

## TypeScript Models

**Location**: `src/models/`

**Key Models**:
- `auth.model.ts` — `AuthRequest`, `AuthResponse`, `CurrentUserType`
- `user.model.ts` — `User`, `Staff`, `Customer`
- `order.model.ts` — `Order`, `OrderItem`, `OrderStatus`
- `product.model.ts` — `Product`, `ProductVariant`, `Inventory`
- `payment.model.ts` — `Payment`, `Cashbox`, `CashTransaction`
- `store.model.ts` — `Store`, `Warehouse`

**Always import and use these types**:
```typescript
import { Order, OrderStatus } from '@/models/order.model';
import { Product } from '@/models/product.model';
```

---

## Common Patterns

### Loading Data

```tsx
import { useState, useEffect } from 'react';
import { api } from '@/api/axios-instance';

function ProductListScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await api.get<Product[]>('/product');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Show error toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      {loading && <ActivityIndicator />}
      {products.map(p => <Text key={p.id}>{p.name}</Text>)}
    </View>
  );
}
```

---

### Form with Validation

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
});

type FormData = z.infer<typeof schema>;

function CreateProductScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/product', data);
      router.back();
    } catch (error) {
      // Handle error
    }
  };

  return (
    <View>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Input
            placeholder="Product name"
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.name && <Text>{errors.name.message}</Text>}

      <Button onPress={handleSubmit(onSubmit)}>
        Create Product
      </Button>
    </View>
  );
}
```

---

### Navigation with Params

```tsx
// Navigate to screen with params
router.push({
  pathname: '/(tabs)/(orders)/[id]',
  params: { id: order.id }
});

// Receive params in screen
import { useLocalSearchParams } from 'expo-router';

function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    loadOrder(id);
  }, [id]);

  // ...
}
```

---

### BottomSheet

**Official `@expo/ui` BottomSheet** with **controlled pattern**.

**Import**:
```tsx
import { BottomSheet } from '@expo/ui';
```

**Basic Usage**:
```tsx
import { BottomSheet } from '@expo/ui';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

function MyScreen() {
  const [isPresented, setIsPresented] = useState(false);

  return (
    <>
      <Button onPress={() => setIsPresented(true)}>
        Open Sheet
      </Button>

      <BottomSheet
        isPresented={isPresented}
        onDismiss={() => setIsPresented(false)}
        snapPoints={[{ fraction: 0.5 }, { fraction: 0.9 }]}
      >
        <ScrollView style={{ flex: 1 }}>
          <Text>Sheet Content</Text>
        </ScrollView>
      </BottomSheet>
    </>
  );
}
```

**Key Props**:
- `isPresented` (boolean) — Controls sheet visibility
- `onDismiss` (() => void) — Called when user dismisses sheet
- `snapPoints` (SnapPoint[]) — Heights where sheet can rest
- `showDragIndicator` (boolean) — Shows/hides drag handle (default: true)

**Snap Points**:
- `'half'` — Approximately half-screen
- `'full'` — Fully expanded
- `{ fraction: number }` — Screen height fraction (0-1)
- `{ height: number }` — Fixed pixel height

**Important Notes**:
- Always wrap content in `<ScrollView>` for proper overflow handling
- Sheet visibility is **controlled** via `isPresented` state
- No ref-based methods (present/dismiss) — use state instead
- Versioned docs: https://docs.expo.dev/versions/v56.0.0/sdk/ui/universal/bottomsheet/

**Example with forwardRef** (for imperative control):
```tsx
import { BottomSheet } from '@expo/ui';
import { forwardRef, useImperativeHandle, useState } from 'react';

interface SheetRef {
  open: () => void;
  close: () => void;
}

export const MySheet = forwardRef<SheetRef, Props>(
  function MySheet({ children }, ref) {
    const [isPresented, setIsPresented] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setIsPresented(true),
      close: () => setIsPresented(false),
    }));

    return (
      <BottomSheet
        isPresented={isPresented}
        onDismiss={() => setIsPresented(false)}
        snapPoints={[{ fraction: 0.6 }]}
      >
        {children}
      </BottomSheet>
    );
  }
);
```

---

## AsyncStorage Keys

Defined in `src/models/app.models.ts`:

```typescript
LOCALE_STORAGE_KEYS = {
  TOKEN: 'sthm23-auth-token',
  USER: 'sthm23-user-profile',
}
```

**Additional keys**:
- `sthm23-theme-mode` — Theme preference
- `sthm23_app-language` — Language preference

**Usage**:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save
await AsyncStorage.setItem(LOCALE_STORAGE_KEYS.TOKEN, token);

// Read
const token = await AsyncStorage.getItem(LOCALE_STORAGE_KEYS.TOKEN);

// Remove
await AsyncStorage.removeItem(LOCALE_STORAGE_KEYS.TOKEN);
```

---

## Platform-Specific Code

Test on **both iOS and Android** — components may behave differently.

**Platform.select**:
```typescript
import { Platform } from 'react-native';

const fontSize = Platform.select({
  ios: 16,
  android: 14,
  default: 16,
});
```

**Platform.OS**:
```typescript
if (Platform.OS === 'ios') {
  // iOS-specific code
}
```

---

## Important Notes

### Expo SDK Version Lock

**Current version**: Expo SDK 56

When adding new packages:
1. Check compatibility with Expo 56
2. Use `npx expo install <package>` (not `npm install`)
3. Verify versioned docs

### NativeWind v4

- Configuration: `tailwind.config.js`, `metro.config.js`, `babel.config.js`
- Global CSS: `src/global.css`
- JSX runtime: `nativewind` (in babel config)

### State Management

**Current approach**:
- React Context for auth, theme
- Component state for most features
- React Query for API data (if used)

**No Redux/MobX** — keep it simple with built-in React hooks.

---

## Development Workflow

### 1. Adding New Screen

**Example**: Create "Debt Payment" screen

1. Create file in appropriate directory:
   ```
   src/app/(tabs)/(payments)/debt-pay.tsx
   ```

2. Implement screen:
   ```tsx
   import { View, Text } from 'react-native';
   import { useLocalSearchParams } from 'expo-router';

   export default function DebtPayScreen() {
     const { debtId } = useLocalSearchParams<{ debtId: string }>();

     return (
       <View className="flex-1 p-4">
         <Text>Pay Debt: {debtId}</Text>
       </View>
     );
   }
   ```

3. Navigate to screen:
   ```tsx
   router.push({
     pathname: '/(tabs)/(payments)/debt-pay',
     params: { debtId: debt.id }
   });
   ```

---

### 2. Adding API Service

**Example**: Create `DebtService`

```typescript
// src/services/debt.service.ts
import { api } from '@/api/axios-instance';

export interface CustomerDebt {
  id: string;
  totalAmount: number;
  paidAmount: number;
  status: 'ACTIVE' | 'PAID';
}

export const DebtService = {
  async getDebts(storeId: string): Promise<CustomerDebt[]> {
    const response = await api.get('/debt', {
      params: { storeId }
    });
    return response.data;
  },

  async payDebt(debtId: string, amount: number) {
    const response = await api.post('/debt/payment', {
      debtId,
      payments: [{ type: 'CASH', amount }]
    });
    return response.data;
  }
};
```

---

### 3. Before Creating New Feature

**Always check existing implementation**:

1. Find similar screen:
   ```bash
   ls src/app/(tabs)/(orders)/
   ```

2. Check existing service:
   ```bash
   ls src/services/
   ```

3. Review existing patterns
4. **Follow existing patterns** — don't introduce new architecture

---

## Related Documentation

- **Root entry point**: `../AGENTS.md`
- **Business concepts**: `../docs/business-domain.md`
- **API endpoints**: `../docs/api-map.md`
- **Backend architecture**: `../billing/AGENTS.md`
- **Web architecture**: `../billing_ui/AGENTS.md`

---

## Quick Commands

```bash
# Development
npm start                         # Start Expo dev server
npm run android                   # Run on Android emulator
npm run ios                       # Run on iOS simulator
npm run web                       # Run in web browser

# Project Management
npx expo install <package>        # Install Expo-compatible package
npx expo prebuild                 # Generate native projects (iOS/Android)

# Code Quality
npm run lint                      # ESLint check
```

---

## Troubleshooting

### "Cannot find module 'expo-camera'"

**Cause**: Native module not prebuilt

**Solution**:
```bash
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

### Navigation type errors after adding route

**Cause**: Expo Router types not regenerated

**Solution**:
```bash
rm -rf .expo
npx expo start
```

### Styling not working

**Cause**: NativeWind configuration issue

**Solution**:
1. Check `metro.config.js` has `withNativeWind`
2. Check `babel.config.js` has `nativewind/babel`
3. Clear cache: `npx expo start --clear`

### "Text strings must be rendered within a <Text> component"

**Cause**: Using `text-primary-foreground` class with NativeWind

**Why it fails**: NativeWind doesn't correctly process complex CSS variables like `text-primary-foreground` defined in `global.css`, causing text to render outside `<Text>` components.

**Solution**: Replace `text-primary-foreground` with `text-white`:
```tsx
// ❌ Wrong
<Text className="text-primary-foreground">Button Text</Text>

// ✅ Correct
<Text className="text-white">Button Text</Text>
```

### "A Jetpack Compose view must be rendered as a direct child of <Host>"

**Cause**: Using `@expo/ui` Compose components (Icon, Picker, Column, Text) without proper `<Host>` wrapper

**Note**: `<Host>` is only needed when using `@expo/ui` Jetpack Compose components (Icon, Column, Picker, Text). Regular React Native components don't need it.

**Better solution**: Use native React Native components instead of `@expo/ui` Compose components:
- For Picker: Use `<Select>` from `@/components/base` (wraps `@react-native-picker/picker`)
- For Icons: Use `CustomIcon` (properly wrapped with `<Host>`)
- For BottomSheet: Use `BottomSheet` from `@expo/ui` (controlled pattern with `isPresented`/`onDismiss`)

---

**Remember**: This mobile app **displays data** and **handles user interactions**. **Business logic lives in the backend.** Always reference versioned Expo docs (v56)!
