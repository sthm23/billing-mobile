# Billing Mobile — Expo + React Native App

> **Context**: Mobile application (brand **STHM**) for the my-billing retail POS system.
> Read the root [`../AGENTS.md`](../AGENTS.md) first.

---

## ⚠️ CRITICAL: Expo Documentation

**ALWAYS use versioned Expo documentation**:
👉 https://docs.expo.dev/versions/v57.0.0/

Expo changes significantly between versions. Do NOT use:
- ❌ Unversioned docs (docs.expo.dev without `/versions/`)
- ❌ Patterns from other Expo versions (v55, v56)
- ❌ Stack Overflow answers without checking the Expo version

Verify the SDK in `package.json` (`expo`) before relying on any doc.

---

## Technology Stack

| Area | Library | Version |
|---|---|---|
| Platform | Expo SDK | 57 (`expo ~57.0.25`) |
| Runtime | React Native / React | 0.86.3 / 19.2.3 |
| Language | TypeScript (`strict`) | ~6.0.3 |
| Routing | Expo Router (typed routes, `Stack.Protected`) | ~57.0.23 |
| Styling | NativeWind **5 (preview)** + `react-native-css` + **Tailwind CSS v4** | 5.0.0-preview.2 / 3.0.4 / 4.2.0 |
| Font | Onest via `@expo-google-fonts/onest` | 0.4.2 |
| Icons | `lucide-react-native` (UI), `CustomIcon` (SF Symbols / Material Symbols) | 1.45.0 |
| Native UI | `@expo/ui` (BottomSheet) | ~57.0.20 |
| Data | `@tanstack/react-query` + `axios` | 5.101.2 / 1.18.1 |
| Forms | `react-hook-form` + `zod` | 7.81 / 4.4 |
| i18n | `i18next` + `react-i18next` + `expo-localization` (en, ru, uz) | 26 / 17 |
| Storage | `@react-native-async-storage/async-storage` | 2.2.0 |

`app.json` enables `typedRoutes`, `reactCompiler` and `userInterfaceStyle: automatic`.

**Not installed yet** (planned): `expo-camera` (barcode scanning), a test runner, ESLint config.

---

## Responsibility

**What mobile does**:
- Display data from the backend API
- Handle user interactions (touch, swipe; barcode scan — planned)
- Client-side validation (UX only)
- Local state, React Query cache, user preferences (theme, language)

**What mobile does NOT do**:
- Implement business logic (backend's responsibility)
- Calculate stock, prices, totals, debt or cashbox balances independently
- Make direct database calls

---

## File Structure

```
billing-mobile/
├── app.json                      # Expo config (name "STHM", icons, splash)
├── metro.config.js               # withNativewind(config, { inlineRem: 16, input: './src/global.css' })
├── babel.config.js               # babel-preset-expo + nativewind/babel, module-resolver, worklets
├── postcss.config.mjs            # @tailwindcss/postcss
├── assets/                       # Project-root assets (alias @/assets/*)
│   ├── brand/                    # STHM logo SVGs (mark, horizontal, app icon; -on-dark variants)
│   ├── i18next/                  # i18next.ts + locales/{en,ru,uz}.ts
│   └── images/                   # App icon, adaptive icon layers, splash, favicon
└── src/                          # Alias @/*
    ├── api/axios-instance.ts     # Axios instances, auth + refresh interceptors
    ├── app/                      # Expo Router routes (thin wrappers around screens/)
    ├── screens/                  # Screen implementations: login, order, payment, product, profile
    ├── components/
    │   ├── base/                 # Design primitives (see COMPONENTS.md)
    │   ├── common/               # EmptyState, LoadingState
    │   ├── product/ order/ cashbox/  # Domain components
    ├── constants/
    │   ├── tokens.ts             # STHM color palette (JS mirror of global.css) + FontFamily
    │   └── theme.ts              # Spacing, BottomTabInset, MaxContentWidth (legacy Fonts)
    ├── global.css                # Tailwind v4 config: STHM tokens, radius, fonts, type-* utilities
    ├── hooks/                    # use-theme, use-theme-control, use-debounce
    ├── icons/                    # CustomIcon (SF Symbols / Material Symbols via <Host>)
    ├── libs/                     # cn() (utils.ts), product-utils.ts
    ├── models/                   # API types (app, auth, order, payment, product, store, user)
    ├── provider/AuthProvider.tsx # Auth context
    └── services/                 # API services + React Query hooks (auth, cashbox, order, product)
```

`src/app` route files mostly import a component from `src/screens/` — put screen code in `screens/`, keep routes thin.

---

## Routing (Expo Router)

### Root (`src/app/_layout.tsx`)

- Loads i18n and the Onest fonts; keeps the native splash (`expo-splash-screen`) until fonts and the saved theme are ready. On font error it falls back to the system font.
- Provider order: `GestureHandlerRootView` → `ThemeControlContext.Provider` → `StatusBar` → `AuthProvider` → `QueryClientProvider`.
- QueryClient: `staleTime` 60 s; no retry for axios responses with status < 500, otherwise up to 2 retries.
- `Stack.Protected`: `(tabs)` when authenticated, `login` when unauthenticated.

Other root routes: `index.tsx` (redirects by auth state), `login.tsx` (→ `screens/login/LoginPage`), `component-demo.tsx` (`/component-demo`, dev showcase).

### Tabs (`src/app/(tabs)/_layout.tsx`)

`NativeTabs` from `expo-router/unstable-native-tabs`, colored from `useTheme()`. Each tab has its own Stack:

| Tab | Routes | Renders |
|---|---|---|
| `(products)` | `index`, `[id]`, `create` | `ProductListScreen`, `ProductDetailScreen`, placeholder |
| `(orders)` | `index`, `[id]`, `create` | `OrderPage`, `OrderDetailScreen`, placeholder |
| `(payments)` | `index`, `[id]` | `CashboxListPage`, `CashboxDetailsPage` |
| `(profile)` | `index`, `create`, `settings` | `MobileProfilePage`, placeholders |
| `(search)` | `index`, `search`, `scan` | redirect, placeholders |

> The STHM redesign replaces this with a custom floating tab bar (Products · Orders · Scan · Cashbox · Profile) — see "Redesign status" in [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md). Until then, keep `NativeTabs`.

### Navigation

```typescript
import { router, useLocalSearchParams } from 'expo-router';

router.push({ pathname: '/(tabs)/(orders)/[id]', params: { id: order.id } });
router.back();

const { id } = useLocalSearchParams<{ id: string }>();
```

After adding a route, typed routes regenerate on `npx expo start` (delete `.expo/` if types are stale).

---

## Path Aliases

`tsconfig.json` + `babel.config.js` (module-resolver):

```typescript
@/*          → src/*
@/assets/*   → assets/*   (project root, NOT src/assets)
```

Always use aliases instead of relative imports.

---

## Styling — STHM Design System

Full rules: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md). Design source: STHM design system (claude.ai artifact "My Billing Design system") and the "My Billing — Mobile" screen mockups.

### Where things live

- **Tailwind config is CSS-only** (Tailwind v4) — there is **no `tailwind.config.js`**. Everything is in `src/global.css`:
  - `:root` / `@media (prefers-color-scheme: dark)` / `:root.dark` / `:root.light` — token values as RGB triplets.
  - `@theme inline` — maps tokens to classes (`--color-*`, `--radius-*`, `--font-*`).
  - `@utility type-*` — text styles.
- **`src/constants/tokens.ts`** — the same palette as hex for JS. **Keep it in sync with `global.css`.**
- **`useTheme()`** (`src/hooks/use-theme.ts`) — returns the current palette. Use it only where `className` does not reach: navigator options, icon `color` props, SVG fills, Reanimated styles.

### Rules

```tsx
// ✅ Tokens via Tailwind classes
<View className="bg-card rounded-xl p-4">
  <Text className="type-body-strong text-ink">Strapela 6м</Text>
  <Text className="type-label text-muted">Склад 1</Text>
</View>

// ❌ Hard-coded colors / StyleSheet for themable values
<View style={{ backgroundColor: '#FFFFFF' }} />
```

- Colors: `bg`, `card`, `sunken`, `ink`, `soft`, `muted`, `line`, `primary`/`on-primary`, `accent`/`on-accent`, `hero*`, `nav*`, `ok|err|warn|info-bg/-fg`, `ph-bg/-fg`, `track`, `seg`, `disabled-bg/-fg`, `scrim`. Text on `accent` is always `text-on-accent` (graphite), never white.
- Fonts: React Native can't pick weights from one custom family, so each weight is its own family. Use `type-*` utilities or `font-onest` / `font-onest-medium` / `font-onest-semibold` / `font-onest-bold`. **Do not combine them with `font-bold`/`font-semibold`** (Android double-bolds).
- Text styles are named `type-*` (not `text-*`) on purpose: tailwind-merge in `cn()` treats unknown `text-*` as a color and would drop it.
- `cn()` (`src/libs/utils.ts`) is a `tailwind-merge` extended with STHM names (`rounded-pill`, `font-onest-*`, `type-*`). Always merge classNames with `cn()`.
- No shadows — blocks are separated by color (`card` on `bg`).
- Icons: lucide, stroke width 2 at 24px.

### Transitional (remove at end of redesign stage 3)

`global.css` keeps **legacy aliases** of the old shadcn names (`background`, `foreground`, `muted-foreground`, `secondary`, `border`, `input`, `ring`, `destructive`, `popover`, `primary-foreground`, `accent-foreground`) mapped to STHM values, and `useTheme()` keeps legacy keys (`background`, `text`, `textMuted`, `surface`, …). **Don't use them in new code.**

⚠️ `bg-muted` / `bg-accent` changed meaning: `muted` is now a **text** color and `accent` is **sage**. For neutral fills use `bg-sunken`.

### Theme mode

`src/hooks/use-theme-control.ts`: `ThemeMode` (`light` | `dark` | `system`), stored under `sthm23-theme-mode`, applied with `Appearance.setColorScheme`. `useThemeControl()` gives `{ themeMode, setThemeMode }`. NativeWind follows the color scheme automatically.

---

## UI Components

Quick reference with exact props: [`COMPONENTS.md`](./COMPONENTS.md). Import from the barrel:

```tsx
import { Button, Input, InputField, Text, VStack } from '@/components/base';
```

Gotchas from the current API:
- `Button` variants are `default | outline | ghost | destructive`, sizes `sm | md | lg`, plus `loading`. A string child is wrapped in `Text` automatically.
- `Input` is a **container View**; text-input props go on `InputField`: `<Input><InputField placeholder="…" /></Input>`.
- There is no `ThemedView` / `ThemedText`.

### BottomSheet (`@expo/ui`)

Controlled pattern only:

```tsx
import { BottomSheet } from '@expo/ui';

<BottomSheet isPresented={open} onDismiss={() => setOpen(false)} snapPoints={['half', 'full']}>
  <Box className="flex-1 p-4">…</Box>
</BottomSheet>
```

- Prefer `'half'` / `'full'` snap points (`{ fraction }` / `{ height }` are unreliable on Android).
- No ref methods; drive it with state. Versioned docs: https://docs.expo.dev/versions/v57.0.0/sdk/ui/

### Icons

- UI icons: `lucide-react-native` directly, or the re-exports in `components/base/icon.tsx`.
- `CustomIcon` (`src/icons/custom-icon.tsx`) renders SF Symbols (iOS) / Material Symbols (Android) by `IconNames`; it wraps `@expo/ui` in `<Host matchContents>`.
- Any `@expo/ui` Jetpack Compose component (Icon, Column, Picker, Text) **must** be inside `<Host>`.

---

## API Communication

`src/api/axios-instance.ts`:
- `BASE_URL` is chosen with `Platform.select`. **It currently points to a LAN dev server** (`http://<lan-ip>:4000/api`, `localhost` for web); production is `https://sthm23.uz/api` (commented). Check it before building a release.
- Exports `api`, `usersApi` (`/users`), `ordersApi` (`/orders`), `productsApi` (`/product`), `paymentsApi` (`/payments`), `warehouseApi` (`/warehouse`). Timeout 30 s, `withCredentials: true`.
- Request interceptor adds `Authorization: Bearer <token>` except for `/login`, `/signup`, `/refresh`, `/logout`.
- On 401: one shared `GET /refresh` (httpOnly cookie) → save new token → retry once. If refresh fails: `POST /logout` and clear stored token/user.

Endpoint reference: [`../docs/api-map.md`](../docs/api-map.md) (verify against the backend controller — parts are outdated).

### Services + React Query

Pattern per domain in `src/services/<domain>/`:
- `<domain>.service.ts` — object with axios calls (`orderService`, `productService`, `cashboxService`).
- `<domain>.queries.ts` — query-key factory (`orderQueryKeys`, …) + hooks (`useOrders`, `useOrderById`, `useCreateOrder`, `useProducts`, `useCashboxList`, `useCloseCashbox`, …).

```tsx
const { data, isLoading, isError, refetch } = useOrders(params);
```

Always handle loading / error / empty states (`components/common/LoadingState`, `EmptyState`).

`toast.service.ts` currently exports **types only** (no working toast function).

---

## Authentication

`src/provider/AuthProvider.tsx` exports `AuthProvider`, `useAuth`, `AuthStatusEnum` (`loading` | `authenticated` | `unauthenticated`).
`useAuth()` → `{ isAuthenticated, authStatus, user, login(data), logout() }`. On start it reads the token and loads `GET /auth/me`.

Role checks in the UI are UX only — the backend enforces permissions.

---

## Storage Keys

| Key | Where | Purpose |
|---|---|---|
| `my_billing_access_token` | `LOCALE_STORAGE_KEYS.TOKEN` (`models/app.models.ts`) | Access token |
| `my_billing_current_user` | `LOCALE_STORAGE_KEYS.USER` | Cached user |
| `sthm23-theme-mode` | `ThemeStorageKey.THEME_MODE` (`hooks/use-theme-control.ts`) | Theme mode |
| `sthm23_app-language` | `assets/i18next/i18next.ts` | Language |

---

## Internationalization

- `assets/i18next/i18next.ts` exports `AppLanguage` (`auto` | `en` | `ru` | `uz`), `setAppLanguage()`, `getSavedLanguageOption()`, default `i18n`.
- Device language is used if it's en/ru/uz, otherwise `ru`.
- Strings live in `assets/i18next/locales/{en,ru,uz}.ts`. Add every new key to all three.

```tsx
const { t } = useTranslation();
t('navigation.products');
```

---

## Forms

React Hook Form + Zod (`@hookform/resolvers/zod`). Wrap fields with `FormControl` from `components/base`. Client validation is UX only — the backend validates again.

---

## Adding Packages

- Use `npx expo install <package>` so versions match SDK 57.
- This repo resolves packages from the **public npm registry** (see `package-lock.json`). If the global npm config points elsewhere, pass `-- --registry=https://registry.npmjs.org/`.

---

## Verification

There is no test runner and no ESLint config yet (`npm run lint` would try to set ESLint up).

```bash
npx tsc --noEmit                         # Type-check (has pre-existing errors — don't add new ones)
npx expo export --platform android       # Bundles the app: catches CSS/import errors
npx expo start --clear                   # Run with a clean NativeWind cache
```

Changes to `app.json` (icon, splash, name) need a native rebuild (`npx expo prebuild --clean` / new dev client).

---

## Known Issues

- `src/app/_layout.tsx`: `ThemeControlContext` value misses `currentMode` (type error).
- `component-demo.tsx`, `SearchBar.tsx`: pass `placeholder` etc. to `Input` instead of `InputField`.
- `Spinner`: `md` and `lg` both map to `'large'`. `AlertDialog` ignores `size`. `Badge` uses `success-500`-style classes that don't exist in the theme.
- `assets/orders/` contains stray route files that don't compile; `scripts/reset-project.js` is missing.
- Service paths that don't match the backend: `searchProductsForOrder` (sends orderId, backend expects warehouseId), `addPaymentToOrder` (`/payments` vs `/payment`), `updateProductVariant` (POST vs PUT).

---

## Troubleshooting

**Styling not applied** — check `metro.config.js` uses `withNativewind`, `babel.config.js` has `nativewind/babel`, then `npx expo start --clear`. Remember Tailwind only generates classes that appear in source; dynamic class strings (`` `gap-${n}` ``) are not generated unless the full class appears somewhere.

**Custom font not applied** — make sure the class sets a family (`type-*`, `font-onest-*`) and that the root layout finished loading fonts.

**"A Jetpack Compose view must be rendered as a direct child of <Host>"** — wrap `@expo/ui` Compose components in `<Host>`, or use RN components (`Select` from base for pickers, `CustomIcon` for icons).

**Navigation type errors after adding a route** — `rm -rf .expo && npx expo start`.

---

## Related Documentation

- Root entry point: [`../AGENTS.md`](../AGENTS.md)
- Design system: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) · Components: [`COMPONENTS.md`](./COMPONENTS.md) · Examples: [`src/components/base/EXAMPLES.md`](./src/components/base/EXAMPLES.md)
- Docs index: [`../docs/INDEX.md`](../docs/INDEX.md) · Features: [`../docs/features/`](../docs/features/) · API map: [`../docs/api-map.md`](../docs/api-map.md)
- Backend: [`../billing/AGENTS.md`](../billing/AGENTS.md)

---

**Remember**: This app **displays data** and **handles user interactions**. **Business logic lives in the backend.** Always use the versioned Expo docs (v57).

**Last updated**: 2026-10-19
