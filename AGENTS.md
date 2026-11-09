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
| Native UI | `@expo/ui` (`CustomIcon`; not for sheets) | ~57.0.20 |
| Sheets | `@gorhom/bottom-sheet` (base `Sheet`) | ^5.2.14 |
| Data | `@tanstack/react-query` + `axios` | 5.101.2 / 1.18.1 |
| Forms | `react-hook-form` + `zod` | 7.81 / 4.4 |
| i18n | `i18next` + `react-i18next` + `expo-localization` (en, ru, uz) | 26 / 17 |
| Storage | `@react-native-async-storage/async-storage` | 2.2.0 |

`app.json` enables `typedRoutes`, `reactCompiler` and `userInterfaceStyle: automatic`.

Barcode scanning: `expo-camera` (`CameraView` + `useCameraPermissions`, config plugin in `app.json` with the camera permission text — needs a native rebuild / new dev client).

**Not installed yet**: a test runner, ESLint config (`npm run lint` tries to install ESLint and fails on the private registry).

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
    ├── screens/                  # Screen implementations: login, order, payment, product, profile, debt
    ├── components/
    │   ├── base/                 # Design primitives (see COMPONENTS.md)
    │   ├── navigation/           # BottomNav (floating tab bar) + useBottomNavInset
    │   ├── brand/                # Logo (official SVGs via SvgXml), SplashView
    │   ├── common/               # EmptyState, LoadingState, ComingSoonScreen
    │   ├── product/ order/ cashbox/  # Domain components
    ├── constants/
    │   ├── tokens.ts             # STHM color palette (JS mirror of global.css) + FontFamily
    │   └── theme.ts              # Spacing, MaxContentWidth (legacy Fonts)
    ├── global.css                # Tailwind v4 config: STHM tokens, radius, fonts, type-* utilities
    ├── hooks/                    # use-theme, use-theme-control, use-debounce
    ├── icons/                    # CustomIcon (SF Symbols / Material Symbols via <Host>)
    ├── libs/                     # cn() (utils.ts), product-utils.ts, date.ts
    ├── models/                   # API types (app, auth, order, payment, product, store, user)
    ├── provider/AuthProvider.tsx # Auth context
    └── services/                 # API services + React Query hooks (auth, cashbox, debt, order, product)
```

`src/app` route files mostly import a component from `src/screens/` — put screen code in `screens/`, keep routes thin.

---

## Routing (Expo Router)

### Root (`src/app/_layout.tsx`)

- Loads i18n and the Onest fonts; keeps the native splash (`expo-splash-screen`) until fonts and the saved theme are ready. On font error it falls back to the system font.
- Provider order: `GestureHandlerRootView` → `ThemeControlContext.Provider` → `StatusBar` → `AuthProvider` → `QueryClientProvider`. `<ToastHost />` is mounted once after `BottomSheetModalProvider`, so toasts show above sheets.
- QueryClient: `staleTime` 60 s; no retry for axios responses with status < 500, otherwise up to 2 retries.
- While the session is being restored it renders `SplashView` (`components/brand`).
- `Stack.Protected`: `(tabs)` when authenticated, `login` when unauthenticated.

Other root routes: `index.tsx` (redirects by auth state), `login.tsx` (→ `screens/login/LoginPage`), `+not-found.tsx` (404 for unknown routes), `component-demo.tsx` (`/component-demo`, dev showcase).

All stacks use `headerShown: false` — screens draw their own header (back `IconButton` + title) inside a `SafeAreaView edges={['top']}`.

**Import `SafeAreaView` from `@/components/base/SafeAreaView`, never from `react-native-safe-area-context`.** On iOS/Android react-native-css gives `className` support only to core components (`View`, `Text`, `ScrollView`, `FlatList`, `Pressable`, `KeyboardAvoidingView`, …) and to `SafeAreaProvider`; the library's `SafeAreaView` silently ignores `className`, so `flex-1` is lost and the screen collapses (works on web, broken on devices). Any other third-party component needs `styled()` from `react-native-css` or a `style` prop.

**No `text-left` / `text-center` / `text-right` classes on a `TextInput`** (incl. `InputField`): react-native-css's TextInput wrapper crashes on text-align on native (`undefined is not a function` in `styles/index.js`). Use the `textAlign` prop. On `Text` these classes are fine.

**A `flex-1` `TextInput` in a row also gets `min-w-0`** (`flex-1 min-w-0 …`): on web a flex child has `min-width: auto`, so the `<input>` keeps its intrinsic width (~20 characters) and pushes the buttons after it out of the row. Android ignores this, so it only shows on web.

**Don't pass both `contentContainerClassName` and `contentContainerStyle`** to a `ScrollView`/`FlatList`: on native the style prop replaces the class styles (padding and gap vanish; web merges them). Use one — `contentContainerStyle` when a value is computed (e.g. `useBottomNavInset()`).

**Typography**: `type-*` classes replace font family/size/leading/tracking — `cn()` drops `Text`'s default `font-onest text-base` for them (`conflictingClassGroups` in `src/libs/utils.ts`). A new `@utility type-*` must be added to that list too.

### Tabs (`src/app/(tabs)/_layout.tsx`)

Expo Router `Tabs` with a custom `tabBar`: **`BottomNav`** (`src/components/navigation/BottomNav.tsx`) — the floating STHM bar **Products · Orders · [Scan] · Cashbox · Profile**. Each tab has its own Stack:

| Tab | Routes | Renders |
|---|---|---|
| `(products)` | `index`, `[id]`, `create`, `history/[variantId]`, `rental/[variantId]` (`?productId[&startDate&endDate]`), `rental-form/[variantId]` (`?productId`), `cleaning/[variantId]` (`?productId`) | `ProductListScreen`, `ProductDetailScreen` (sale) or `RentalProductScreen` (rental mode; `[id]?variantId&startDate&endDate`), `ComingSoonScreen`, `StockHistoryScreen` (params `title`, `subtitle`, `stock`), `RentalProductScreen` (variant preselected), `RentalItemFormScreen` / `CleaningNewScreen` (via `VariantLoader`) |
| `(orders)` | `index`, `[id]`, `create`, `search`, `scan`, `pay/[id]` | `OrderPage`, `OrderDetailScreen` (CREATED/HOLD → `OrderCartScreen`, else read-only), `OrderCartScreen` (new order), `OrderSearchScreen`, `ScanScreen` (full-screen modal), `OrderPayScreen` |
| `(rentals)` | `index`, `[id]`, `create`, `edit/[id]`, `pay/[id]` (`?created=1`), `issue/[id]`, `return/[id]`, `calendar`; `create?productId&variantId[&startDate&endDate]` — booking started from an item card (with its dates) | Rental mode only (see «Rental» below). `RentalListScreen`, `RentalDetailScreen`, `RentalFormScreen` (new / edit / preset item), `RentalPayScreen` (`pay`, and `mode="issue"` for `issue/[id]`), `RentalReturnScreen`, `RentalCalendarScreen` |
| `(cashbox)` | `index`, `[id]` | `CashboxListPage`, `CashboxDetailsPage` |
| `(profile)` | `index`, `create`, `settings`, `store-settings`, `debtors/index`, `debtors/[customerId]`, `debtors/pay` (`?customerId&kind&id`) | `MobileProfilePage`, `CreateStaffScreen` (new employee, OWNER only), `ComingSoonScreen`, `StoreSettingsScreen` (store modes, OWNER only), `DebtorsScreen`, `DebtorScreen`, `DebtPayScreen` |

Unbuilt features use `ComingSoonScreen` (routes) or a **disabled** button — never a button that silently does nothing.

- The center **Scan** button starts a new sale: `/(tabs)/(orders)/create?scan=1` — an empty cart that opens the scanner right away (when the seller has one warehouse).
- **Store mode** (`useStoreMode()`, `src/hooks/use-store-mode.ts`): in rental mode the second tab is **Rentals** (`(rentals)`) instead of Orders and the center button opens `/(tabs)/(rentals)/create` (new booking). A store with only one mode always shows it; a store with both uses the menu choice saved on the device — switched by `NavModeSwitch` («Заказы | Аренды», `components/navigation/NavModeSwitch.tsx`) on top of both lists, or in Profile → «Нижнее меню».
- The bar is **absolutely positioned** over the content and **hidden** on nested screens (any stack screen above a tab's root) and while the keyboard is open.
- **Tab root screens must reserve space for it**: `const bottomInset = useBottomNavInset();` → `contentContainerStyle={{ paddingBottom: bottomInset }}` on the scroll container.
- To add a tab: add the route group, a `Tabs.Screen` in the layout, and an entry in `LEFT_TABS` / `RIGHT_TABS` in `BottomNav.tsx` (lucide icon + i18n key under `navigation.*`).

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

- Colors: `bg`, `card`, `sunken`, `ink`, `soft`, `muted`, `line`, `primary`/`on-primary`, `accent`/`on-accent`, `hero*` (incl. `hero-err`, `hero-warn`), `nav*`, `ok|err|warn|info-bg/-fg`, `ph-bg/-fg`, `track`, `seg`, `disabled-bg/-fg`, `scrim`. Text on `accent` is always `text-on-accent` (graphite), never white.
- Fonts: React Native can't pick weights from one custom family, so each weight is its own family. Use `type-*` utilities or `font-onest` / `font-onest-medium` / `font-onest-semibold` / `font-onest-bold`. **Do not combine them with `font-bold`/`font-semibold`** (Android double-bolds).
- Text styles are named `type-*` (not `text-*`) on purpose: tailwind-merge in `cn()` treats unknown `text-*` as a color and would drop it.
- `cn()` (`src/libs/utils.ts`) is a `tailwind-merge` extended with STHM names (`rounded-pill`, `font-onest-*`, `type-*`). Always merge classNames with `cn()`.
- No shadows — blocks are separated by color (`card` on `bg`).
- Icons: lucide, stroke width 2 at 24px.

⚠️ There are **no** shadcn-style names (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-destructive`, `typography-*`, …) — they compile to nothing. `muted` is a **text** color and `accent` is **sage**; for neutral fills use `bg-sunken`, for borders/dividers `border-line`.

- Brand logo: `<Logo width={…} onDark? />` / `<Logo variant="icon" />` from `components/brand/Logo` — never redraw or recolor it.

### Theme mode

`src/hooks/use-theme-control.ts`: `ThemeMode` (`light` | `dark` | `system`), stored under `sthm23-theme-mode`, applied with `Appearance.setColorScheme`. `useThemeControl()` gives `{ themeMode, setThemeMode }`. NativeWind follows the color scheme automatically.

---

## UI Components

Quick reference with exact props: [`COMPONENTS.md`](./COMPONENTS.md). Import from the barrel:

```tsx
import { Button, Input, InputField, Text, VStack } from '@/components/base';
```

STHM components: `Button`, `IconButton`, `Chip`, `Segmented`, `Stepper`, `SearchField`, `HeroCard`, `ListCard`, `StatusBadge`, `Money`, `Card`, `PhotoPlaceholder`, `Avatar`, `Input`/`InputField`, `TextArea`, `Select`, `FormControl`, `Modal`, `AlertDialog`, `Toast` (`toast.show`). Live showcase with a theme switch: `/component-demo`. Build screens from these before writing custom views.

Gotchas:
- `Button` variants: `primary | accent | secondary | danger | ghost | hero` (`hero` — on the dark hero block); sizes `sm` 36 / `md` 44 (default) / `lg` 56; `icon`, `full`, `loading`. `IconButton` has the same `hero` variant.
- `Input` is a **container View**; text-input props go on `InputField`: `<Input invalid={…}><InputField placeholder="…" /></Input>`.
- Amounts: `<Money value={…} />` or `formatMoney()` from `src/libs/format.ts` — display only, never compute totals on the client.
- Icon-only buttons need `accessibilityLabel` (use `t('common.*')`).
- Short success/error feedback that needs no confirmation: `toast.show(message, 'success' | 'error')` from `@/components/base` — not `Alert`. Keep `Alert` / `AlertDialog` for confirmations (e.g. archive).
- Pull to refresh: `refreshControl={useRefreshControl(refetch)}` from `@/hooks/use-refresh-control` on the screen's FlatList/ScrollView (theme colours; spins only during a pull). Paginated lists reset to page 1 and invalidate their query keys. Not on the cart — it holds unsaved edits.
- There is no `ThemedView` / `ThemedText`.

### Sheet (`@gorhom/bottom-sheet`)

Use the base `Sheet` (`src/components/base/Sheet.tsx`) — never `@expo/ui` `BottomSheet`: on Android that is a Compose sheet where React Native children get no height and it shows empty.

```tsx
import { Sheet, SheetScrollView } from '@/components/base/Sheet';

<Sheet isOpen={open} onClose={() => setOpen(false)}>          {/* size: 'full' (default) | 'half' | 'auto' */}
  <SheetScrollView className="flex-1" contentContainerClassName="px-4 gap-3">…</SheetScrollView>
</Sheet>
```

- Controlled by `isOpen`; `onClose` fires on swipe down, backdrop tap and back button.
- Inside a sheet use `SheetScrollView`, `SheetFlatList`, `SheetTextInput` (gorhom's, with `className` support) instead of the RN ones — they cooperate with the sheet's gesture and keyboard.
- `BottomSheetModalProvider` is in the root layout, inside the query/auth providers.
- `size="auto"` fits the content: its children must not use `flex-1`.
- Give `SheetScrollView` / `SheetFlatList` `className="flex-1"` in `full` / `half` sheets so the list is bounded by the sheet.
- Never wrap a `SheetScrollView` / `SheetFlatList` in gorhom's `BottomSheetView`: on focus it marks the sheet content as a plain view (its effect runs after the child's) and the list stops scrolling. `Sheet` uses `BottomSheetView` only for `size="auto"` — so an `auto` sheet must not contain a scrollable.

### Icons

- UI icons: `lucide-react-native` directly, or the re-exports in `components/base/icon.tsx`.
- `CustomIcon` (`src/icons/custom-icon.tsx`) renders SF Symbols (iOS) / Material Symbols (Android) by `IconNames`; it wraps `@expo/ui` in `<Host matchContents>`.
- Any `@expo/ui` Jetpack Compose component (Icon, Column, Picker, Text) **must** be inside `<Host>`.

---

## API Communication

`src/api/axios-instance.ts`:
- `BASE_URL` is chosen with `Platform.select`. **It currently points to a LAN dev server** (`http://<lan-ip>:4000/api`, `localhost` for web); production is `https://sthm23.uz/api` (commented). Check it before building a release.
- Exports `api`, `usersApi` (`/users`), `ordersApi` (`/orders`), `productsApi` (`/product`), `paymentsApi` (`/payment`), `warehouseApi` (`/warehouse`), `categoryApi` (`/category`). Timeout 30 s, `withCredentials: true`.
- Request interceptor adds `Authorization: Bearer <token>` except for `/login`, `/signup`, `/refresh`, `/logout`.
- On 401: one shared `GET /refresh` (httpOnly cookie) → save new token → retry once. If refresh fails: `POST /logout` and clear stored token/user.

Endpoint reference: [`../docs/api-map.md`](../docs/api-map.md) (verify against the backend controller — parts are outdated).

### Services + React Query

Pattern per domain in `src/services/<domain>/`:
- `<domain>.service.ts` — object with axios calls (`orderService`, `productService`, `cashboxService`).
- `<domain>.queries.ts` — query-key factory (`orderQueryKeys`, …) + hooks (`useOrders`, `useOrderById`, `useCreateOrder`, `useProducts`, `useCashboxList`, `useCloseCashbox`, `useStoreById`, `useCreateStaff`, …).
- `<domain>.types.ts` — request/response types (`cashbox`, `store`).

Domains: `auth`, `cashbox` (+ `useOpenCashboxes`, `useOpenCashbox`), `customer` (search/create customers), `debt` (`useDebtors`, `useDebtor`, `useRepayDebt`), `order` (+ `useSaveOrder`, `useCreateOrderPayment`, `useAddToOrder`), `product` (+ `useProductVariantSearch(warehouseId, text)`, `useStoreCategories`, `useStockMovements`, `useInventoryMovement`, `useArchiveProduct`), `store` (owner's store + `POST /store/staff`).

Prisma `Decimal` fields (`price`, `totalAmount`, `retailPrice`, …) arrive as strings — wrap in `Number()` before arithmetic.

API errors: NestJS returns `{ message: string | string[] }` — show it with `getApiErrorMessage(error, fallback)` from `src/libs/api-error.ts`.

### Order flow (sale)

- **Cart state** lives in `src/screens/order/cart/cart-store.ts` (`cartStore` + `useCart()`, a small `useSyncExternalStore` store) and is shared by the cart, search and scanner screens. One cart at a time; `OrderCartScreen` resets it on mount (`startNew` / `loadOrder`).
- **Saving**: `useSaveOrder()` creates the order on the first save (`POST /orders`) and then replaces its content (`POST /orders/items`, which deletes lines left out). «Бронь» saves and goes back; «Оплатить» saves and opens `pay/[id]`.
- **Prices**: lowering = `sale` (absolute per unit), raising = `retailPrice` (`PriceSheet`). Only owner/manager may lower (`canLowerPrice()` in `src/libs/roles.ts` — UX only, the backend enforces it).
- **Totals** in the cart are a preview; `OrderPayScreen` uses the saved order. It never sends overpayment: cash is reduced by the change. A partial payment needs a customer (`CustomerPickerSheet`).
- **Warehouse**: the cart's warehouse is one of `user.staff.warehouse` (`useStaffWarehouses`); with several, the seller picks one before adding products.
- **Types**: list `Order` has only the `warehouse` object (no `warehouseId`); `OrderDetail.warehouseId` exists.

### Debtors flow (stage 8)

A debt is owed to the **store**: every employee (seller, cashier, manager, owner) sees all debtors and may accept a repayment. Business rules: [`../docs/features/debt.md`](../docs/features/debt.md).

- **Profile**: card «Должники» (count + total from `useDebtors().summary`) for every employee → `/(tabs)/(profile)/debtors`.
- **List** (`screens/debt/DebtorsScreen.tsx`, `GET /debt/debtors`): hero «Общий долг» + chip «Клиентов: N», tiles «Дольше 30 дней» (`over30`) / «Погашено за месяц» (`paidInPeriod` — DEBT_PAYMENT in the month; the app sends `monthRange()` from `libs/date.ts`), search, `Segmented` По сумме / По дате (`sort`). Rows by customer with an age badge: > 30 days `err`, ≥ 21 `warn`, else neutral.
- **Customer** (`DebtorScreen.tsx`, `GET /debt/debtors/:customerId`): the customer's open debts (ORDER / MANUAL); with a single debt it opens the payment right away (`router.replace`).
- **Payment of one debt** (`DebtPayScreen.tsx`, design «OrderPay» in debt mode): remaining, progress, method tiles + amounts (`PaymentMethodsInput`, shared with `OrderPayScreen`), cash change, payment history. `useRepayDebt()` → ORDER: `POST /payment` (no stock movement), MANUAL: `POST /debt/payment`. Overpayment is never sent (cash minus change); the backend rejects it anyway.
- **Cashbox**: with an own open cashbox (`GET /cashbox/open` → `isMine`) the backend takes it. Otherwise `CashboxPickerSheet` (`components/cashbox`): «Открыть свою кассу» (`POST /cashbox`, warehouse chips if several) or pick another open cashbox of the store → `cashboxId`.
- i18n: top-level `debtors.*`.

### Rental (phase 6, in progress)

Wedding-salon rental: business rules [`../docs/features/rental.md`](../docs/features/rental.md), API [`../billing/docs/rental/03_RENTAL_API.md`](../billing/docs/rental/03_RENTAL_API.md), plan `../billing/docs/rental/04_RENTAL_IMPLEMENTATION_PLAN.md` (phase 6). UI source: the STHM screens artifact, pages «Аренда · …».

- **Store modes**: `Store.salesEnabled` / `rentalEnabled` come with the profile (`user.staff.store`). `useStoreMode()` → `{ salesEnabled, rentalEnabled, isMixed, navMode, setNavMode }` — UX only, the backend rejects what the store has turned off.
- **Store settings** (`screens/profile/StoreSettingsScreen.tsx`, OWNER): two switches; turning off the only enabled mode switches to the other (both off is impossible; the backend rejects it too). `PUT /store/:id` needs `attributeIds`/`brandIds`, so the current ones are sent back (`useUpdateStoreModes`). After saving: a newly enabled rental sets the menu to rental on this device, and `useAuth().refreshUser()` reloads the profile so the menu follows at once.
- **API**: `services/rental/` — `rentalService` (every `/rental` endpoint), hooks in `rental.queries.ts` (`useRentals`, `useRentalSummary`, `useRental`, `useRentalAvailability`, `useRentalCalendar`, `useSimilarVariants`, `useCleaningConflicts`, mutations). Every mutation stores the returned details and invalidates rentals, cashboxes, orders and debts. Money fields are Decimal strings — display only.
- **Set discount**: `libs/set-discount.ts` — an exact copy of `billing_ui/src/app/shared/utils/set-discount.ts` (algorithm in `docs/features/rental.md#set-discount-distribution`). Change both or neither.
- **List** (`screens/rental/RentalListScreen.tsx`): search `q` (debounced), quick filters `view` with counters from `GET /rental/summary`, pages via `useRentalsInfinite`. Order per filter (`viewSort` in `rental-format.ts`): bookings by `startDate` asc, rentals out by `endDate` asc, «Все» by `startDate` desc. Rows are grouped by the day they are about (booking — issue day, out — return day) with overdue ones (backend `overdue` flag) in «Просрочено»; group counts are of the loaded rows only.
- **Card** (`screens/rental/RentalDetailScreen.tsx`): totals (`HeroCard`), stages, customer (call), dates, items with per-line state (in salon / with customer / returned / dry cleaning until — from `returns[].items[].availableFrom`), collateral, payments (payments, penalties, early-return and cancel refunds), bottom actions by status and `dueAmount`, «⋯» menu for a booking (a `Sheet`, not an RN `Modal`): «Изменить» → `edit/[id]`, «Отменить бронь» (OWNER/MANAGER) → `CancelRentalSheet`. «Выдать» → `issue/[id]`, «Принять оплату» → `pay/[id]`, «Вернуть залог» → confirmation sheet (`POST /rental/:id/collaterals/:cid/return`; enabled after full payment or on a cancelled booking, warns about items still out; several held — one button per collateral). «Принять возврат» → `return/[id]`.
- **Booking form** (`screens/rental/form/RentalFormScreen.tsx`, new and `edit/[id]` — BOOKED only): warehouse chips (several warehouses), customer (`CustomerPickerSheet`), dates (`DateRangeSheet` — own month grid, no date-picker package; one day → back next day by 12:00), items from `useRentableVariantSearch` (product search filtered to `canRent` + day price) with free units from `useRentalAvailability` («Свободно N из M» / «Занято» + «Заменить» → `ReplaceItemSheet`, `GET /rental/similar`), services (`ServiceSheet`), total with a set discount: OWNER/MANAGER type the agreed total and `distributeSetDiscount` spreads it over the lines (sellers keep saved discounts only — the backend enforces it). Totals are a preview. Booking dates are salon dates: `salonDate()` in `rental-format.ts` converts backend boundaries by the fixed UTC+5 offset (Hermes may lack time zone data). A new booking opens `pay/[id]?created=1`.
- **Payment and collateral** (`screens/rental/RentalPayScreen.tsx`, `POST /rental/:id/payments`): `PaymentMethodsInput` (cash change as in debt payments) + collaterals (Паспорт / Золото / Другое, several). Money needs a cashbox — own open one or `CashboxPickerSheet`; a collateral alone does not. Also opened by «Принять оплату» on the card.
- **Issue** (`RentalPayScreen mode="issue"`, `POST /rental/:id/issue`, design «Аренда · выдача»): «Осталось оплатить», a checklist of the lines (the backend issues the whole booking — every line must be ticked, the checklist is UX only), collateral: a held one is shown; without one — add one or confirm the «Без залога» switch (the backend records `issuedWithoutCollateral`), optional extra payment (cashbox as in payments). Date and stock checks are the backend's (errors shown on the screen).
- **Cancel** (`screens/rental/CancelRentalSheet.tsx`, `POST /rental/:id/cancel`, OWNER/MANAGER, BOOKED): «Внесено», refund 0 … paid (chips Всё / Половина / 0), refund method when > 0, reason. A refund needs a cashbox (own or `CashboxPickerSheet`); the rest stays as income.
- **Return** (`screens/rental/RentalReturnScreen.tsx`, design «Аренда · возврат»; return moment = now, backdating is web-only): lines still out (checkbox, «сколько вернули» stepper for qty > 1, dry cleaning switch + days, default `variant.defaultCleaningDays`). Every number comes from `useRentalReturnPreview` (`POST …/returns/preview` as a query, debounced by a JSON key, previous data kept): plan / fact days, overdue → the penalty is prefilled once with `suggestedPenalty` + «Просрочка N дн.» (manual, editable; a penalty needs a reason — no preview without it), early return → refund chips 0 / «за N дн.» (`unusedDaysAmount`) + amount ≤ `maxEarlyReturnRefund` for OWNER/MANAGER, a note for sellers; totals, due (payment, optional; the rest → debt when fully returned) or `cashOutAmount` (method required). Submit is enabled only when the preview matches the inputs. Cleaning conflicts (`useCleaningConflicts`) are a warning. Money in/out needs a cashbox (own or `CashboxPickerSheet`).
- **Calendar** (`screens/rental/RentalCalendarScreen.tsx`, list header icon → `calendar`, design «Аренда · календарь»): month / week grid with ↑ issues and ↓ returns per day and the picked day's lists, from `useRentalAgenda` (`GET /rental/agenda` — the backend decides the day: a started booking and an overdue return are «today»). Grid helpers (`monthGrid`, `weekStart`, `formatMonth`, …) are in `rental-format.ts`.
- **Item card** (`screens/rental/product/RentalProductScreen.tsx`, design «Аренда · карточка вещи», 2026-11-09): the product card in rental mode — `(products)/[id]` when `navMode === "rent"` (rental-only store or «Аренды» menu), and `(products)/rental/[variantId]` (from the sale card «Аренда» row `RentalPriceRow` or a similar item of another product) with the variant preselected. Variant chips per attribute with free units `N/M` on the picked dates or today (`RentalVariantPicker`, `useRentalAvailability` over all rentable variants), dates on the month occupancy grid (`RentalDatesCalendar`, `useRentalCalendar` of the variant; `pickRangeDay` / `effectiveEnd` from `rental-format.ts` are shared with `DateRangeSheet`: one day → back next day by 12:00, past days locked). Result (`RentalAvailabilityResult`): free N of M + price preview «дни × цена» + «Вернуть до 12:00»; partly / all busy → who holds the units (`GET /rental/calendar` on the period: `rentals[].code/overdue`, cleanings); busy → «Свободно с …» + «Сдвинуть на …» from `nextFreeStart` (`GET /rental/availability?nextFree=true`; `null` with an overdue unit → «когда освободится — неизвестно») and free similar items (`GET /rental/similar`). Nearest bookings and planned dry cleanings with cancel (`RentalVariantActivity`). OWNER/MANAGER «Управление»: links only — «Цена и аренда» (`rental-form`), «История движения» (`history`), «Отправить в химчистку» (`cleaning`); a not-rented variant shows «Включить аренду» → `rental-form`. Bottom button «Забронировать · даты · сумма» → `(rentals)/create?productId&variantId&startDate&endDate`. Attribute helpers (`buildNameById`, `buildAttributeMap`, `getVariantAttrs`, `findVariantByAttrs`) live in `libs/product-utils.ts`, shared with the sale card.
- **«Цена и аренда»** (`screens/rental/RentalItemFormScreen.tsx`, OWNER/MANAGER): `canRent`, day price, default dry-cleaning days, sale price (shown only when the store sells) — `useUpdateVariant` (`PUT /product/variants/:id`, `price` always sent). Units owned are read-only — stock changes go through «Приход / Списание» (StockMovement).
- i18n: `rental.*`, `storeSettings.*`, `navigation.rentals` / `navigation.newBooking`.

### Summaries (sales and cashbox)

All totals come from the backend; the client sends its local day bounds from `todayRange()` (`libs/date.ts`, also `formatTime`, `formatDayMonth`, `isSameDay`), because the server time zone may differ.

- **Orders screen**: HeroCard «Продажи сегодня» — `useTodaySalesSummary()` (`services/order/order.queries.ts`, `GET /orders/summary`, type `OrdersSummary`): chip «Заказов: N», tiles Оплачено / В долг. Scope by role is decided by the backend.
- **Cashbox list**: `CashboxTodayHero` from `GET /cashbox` → `today` (`CashboxTodaySummary`): «Сегодня в открытых кассах» (chip «Открыто: N», Приход/Расход за сегодня) or «Нет открытых касс» + «Последняя закрыта сегодня/вчера/DD.MM в HH:MM». Rows show the shift: open «с 09:00» (another day «с 20.10, 09:00»), closed «16.10, 09:00–19:30» (`closedAt`).
- **Cashbox details**: hero Приход/Расход and `PaymentMethodTiles` (`byMethod`) from `GET /cashbox/:id` → `summary` (`CashboxSummary`). A closed cashbox: label «Итог смены», «Смена 16.10 · 09:00 – 19:30».
- Balances and shift totals include all payment methods (CASH, CARD, Click, Перечисление).
- i18n: `order.summary.*`, `payment.today.*`, `payment.shiftTotal`, `payment.shift`, `payment.since`.

### Product flow

- **List** (`ProductListScreen`): search + chips «Все · N», store top categories (`GET /category/:storeId/categories`), «Мало · N» (toggle, combines with a category). Filtering, counts and the low-stock threshold come from `GET /product` (`search`, `categoryId`, `lowStock`; `counts`, `lowStockThreshold`). `ProductCard` badge is `err` when the total ≤ `lowStockThreshold`, else `ok`.
- **Card** (`ProductDetailScreen`): «В заказ · {sum}» opens `AddToOrderSheet` — «Новый заказ» fills the cart (`cartStore.startNew(product.warehouseId)` + `addVariant(variant, quantity)`) and opens `/(tabs)/(orders)/create?keep=1` (`OrderCartScreen` `keepCart` keeps the prefilled cart); an open CREATED/HOLD order of the product's warehouse → `useAddToOrder` (GET order → add to the variant's line, keeping its price → `POST /orders/items`) + toast «Товар добавлен в заказ».
- «Приход / Списание» (`StockMovementSheet` → `POST /warehouse/:id/inventory`) and archive (`DELETE /product/:id`) are shown only to owner/manager (`canManageProducts()` in `libs/roles.ts` — UX only). «История» (`StockHistoryScreen`, `GET /product/variants/:id/stock-movements`) — all staff.
- Margin «Продажа · маржа N%» is display-only. Edit (pencil) is disabled.
- `libs/product-utils.ts`: `getVariantLabel`, `getLatestCostPrice` (skips movements without a cost; the cart's `latestReceiptCost` too).

```tsx
const { data, isLoading, isError, refetch } = useOrders(params);
```

Always handle loading / error / empty states (`components/common/LoadingState`, `EmptyState`).

`services/toast.service.ts` exports **types only** — use `toast` from `components/base/Toast`.

---

## Authentication

`src/provider/AuthProvider.tsx` exports `AuthProvider`, `useAuth`, `AuthStatusEnum` (`loading` | `authenticated` | `unauthenticated`).
`useAuth()` → `{ isAuthenticated, authStatus, user, login(data), logout() }`. On start it reads the token and loads `GET /auth/me`.

Role checks in the UI are UX only — the backend enforces permissions.

- Owner = `user.role === UserRole.OWNER` (not `staff.role`). The owner's store is `user.staff.storeId`.
- Owner-only UI: Profile → «Сотрудники» (new employee). The screen also shows «нет доступа» for non-owners.

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
npx tsc --noEmit                         # Type-check — must stay at 0 errors
npx expo export --platform android       # Bundles the app: catches CSS/import errors
npx expo start --clear                   # Run with a clean NativeWind cache
```

Changes to `app.json` (icon, splash, name) need a native rebuild (`npx expo prebuild --clean` / new dev client).

---

## Known Issues

- Client-side totals that belong to the backend: order subtotal/discount preview (`OrderCartScreen`, `OrderDetailScreen`).
- Not built yet (disabled buttons / `ComingSoonScreen`): product create/edit, open cashbox from the cashbox list (opening works only from the debt payment flow, `CashboxPickerSheet`), cashbox filters, order-level discount, creating a manual debt (`POST /debt`). Staff creation has no «comment» field (not stored by the backend).
- `scripts/reset-project.js` (referenced by `npm run reset-project`) is missing.

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

**Last updated**: 2026-10-22
