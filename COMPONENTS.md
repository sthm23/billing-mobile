# Base Components — Quick Reference

> STHM design primitives in `src/components/base/`, built on React Native + NativeWind.
> Tokens and rules: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md). Live showcase: `/component-demo` (light / dark switch on top).

---

## Import

```tsx
import { Button, HeroCard, ListCard, SearchField, Text } from '@/components/base';
```

Every component's `*Props` type is exported too. Icons are lucide components (`import { Plus } from 'lucide-react-native'`).

---

## Actions

### Button

Pill button. At most one `primary` and one `accent` per screen.

| Prop | Type | Default |
|---|---|---|
| `variant` | `'primary' \| 'accent' \| 'secondary' \| 'danger' \| 'ghost' \| 'hero'` | `'primary'` |
| `size` | `'sm'` 36 · `'md'` 44 · `'lg'` 56 | `'md'` |
| `icon` | lucide component (left of the label) | — |
| `full` | `boolean` — full width | `false` |
| `loading` | `boolean` — spinner, disabled | `false` |
| `disabled` | `boolean` — neutral disabled look | — |
| `textClassName` | `string` | — |

```tsx
<Button variant="accent" size="lg" full onPress={pay}>Оплатить</Button>
<Button icon={Plus}>Новый</Button>
<Button variant="danger" icon={Trash2}>Удалить</Button>
```

- A string child is the label (Onest bold). Other children render as-is (`ButtonText`, `ButtonIcon` available).
- Main screen action → `size="lg"`.
- `hero` — secondary action on the dark `hero` block (`bg-hero-sub`, light label and icon).

### IconButton

Round icon-only button. `accessibilityLabel` is required.

| Prop | Type | Default |
|---|---|---|
| `icon` | lucide component (required) | — |
| `variant` | `'card' \| 'sunken' \| 'primary' \| 'accent' \| 'danger' \| 'hero'` | `'card'` |
| `size` | `'sm'` 36 · `'md'` 44 · `'lg'` 52 | `'md'` |

```tsx
<IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={router.back} />
<IconButton icon={ScanBarcode} variant="accent" size="lg" accessibilityLabel={t('common.scan')} />
```

`card` on `bg`, `sunken` inside a card.

### Chip

Filter / option chip.

| Prop | Type | Default |
|---|---|---|
| `label` | `string` | — |
| `selected` | `boolean` — black | `false` |
| `tone` | `'default'` (white, on `bg`) · `'sunken'` (in a card) · `'err'` («Мало · 3») | `'default'` |
| `size` | `'md'` 36 · `'lg'` 40 | `'md'` |

### Segmented

Single choice on a track. Generic over the value type. `variant`: `track` (default, on the screen background) or `sunken` (inside a card — in dark mode `track` equals `card`).

```tsx
<Segmented
  options={[{ value: 'all', label: 'Все' }, { value: 'open', label: 'Открытые' }]}
  value={filter}
  onChange={setFilter}
/>
```

### Stepper

Quantity control. UI bounds only — the backend validates stock.

| Prop | Type | Default |
|---|---|---|
| `value` / `onChange` | `number` / `(n) => void` | — |
| `min` / `max` | `number` | `1` / — |
| `vertical` | `boolean` — + on top (order lines) | `false` |
| `size` | `'sm'` 34 · `'md'` 40 | `'md'` |
| `disabled` | `boolean` | `false` |

### Pressable

RN `Pressable` + `className`, `active:opacity-70`, `opacity-50` when disabled.

---

## Display

### HeroCard

The one dark main block of a screen: totals only, amounts from the backend.

| Prop | Type | Default |
|---|---|---|
| `label` | `string` — caption | — |
| `amount` | `string \| number` | — |
| `currency` | `string \| null` | `'UZS'` |
| `chip` / `chipTone` | `string` / `'neutral' \| 'accent'` | — / `'neutral'` |
| `tiles` | up to 2 × `{ label, value, tone?: 'default' \| 'accent' \| 'err' \| 'warn', signed? }` | — |
| `children` | extra content (actions, progress) | — |

```tsx
<HeroCard
  label="Сумма в кассе"
  chip="Открыта"
  chipTone="accent"
  amount={cashbox.balance}
  tiles={[
    { label: 'Приход', value: cashbox.income, tone: 'accent', signed: true },
    { label: 'Расход', value: cashbox.expense, tone: 'err' },
  ]}
/>
```

### ListCard

List row for orders, cashboxes, debtors, products. Pressable when `onPress` is set.

| Prop | Type |
|---|---|
| `title`, `subtitle` | `string` |
| `lead` | `string` — initials «ТС» or «#127» in a round lead |
| `leading` | `ReactNode` — custom lead (e.g. `<PhotoPlaceholder size="md" />`) |
| `amount` / `amountTone` | `string \| number` / `'default' \| 'err'` |
| `badge` | `{ label, tone: StatusTone }` |
| `highlight` | `boolean` — accent ring + accent lead |

### StatusBadge

`label` (required — color is never the only signal), `tone`, `size: 'sm' | 'md'`.

| Tone | Use |
|---|---|
| `ok` | Завершено, приход, в наличии |
| `warn` | Ожидание, мало, 20–30 дней |
| `err` | Долг, расход, нет на складе |
| `info` | Создано |
| `neutral` | Закрыта, отменено |
| `accent` | Открыта |

### Money

Formatted amount, digits tabular, «UZS» smaller and `muted`. Display only.

```tsx
<Money value={order.totalAmount} className="text-[15px] text-ink" />
<Money value={income} signed currency={null} className="text-accent" />
```

Props: `value`, `signed`, `currency` (`'UZS'`; `null` hides), `className`, `currencyClassName`. Formatting helper: `formatMoney()` in `src/libs/format.ts` («18 056 319», «−6 443 681»).

### Card

`variant`: `'default'` (white, `rounded-xl`) · `'hero'` (dark, `rounded-2xl`) · `'sunken'` (plate in a card, `rounded-md`). `p-4`, no shadow.

### PhotoPlaceholder

`size`: `sm` 44 · `md` 56 · `lg` 64 · `hero` full width × 260.

### Avatar

`size`: `sm` 32 · `md` 44 · `lg` 64 · `xl` 96. `tone`: `sunken` (default) · `accent` (current user / highlighted) · `primary`. `AvatarFallbackText` shows up to 2 initials; `AvatarImage` shows a photo.

---

## Forms

### Input + InputField

`Input` is the filled container; `InputField` is the `TextInput`.

| `Input` prop | Type | Default |
|---|---|---|
| `size` | `'sm'` 40 · `'md'` 48 · `'lg'` 52 (forms) | `'md'` |
| `variant` | `'sunken'` (in a card) · `'card'` (on `bg`) | `'sunken'` |
| `invalid` | `boolean` — red ring | `false` |

```tsx
<Input size="lg" invalid={!!errors.login}>
  <InputField placeholder={t('login.login')} value={value} onChangeText={onChange} autoCapitalize="none" />
</Input>
```
> `placeholder`, `value`, `onChangeText` go on **`InputField`**.

### SearchField

Pill search (48px) with search icon, clear button (when there's text) and optional accent scan button.

Props: `TextInput` props + `onScanPress?`, `variant: 'card' | 'sunken'` (default `card`).

### TextArea

Multiline, filled `sunken`, `rounded-md`. Props: `size`, `error`, `rows` (default 3), `TextInput` props.

### Select

Native picker (`@react-native-picker/picker`) in a filled `sunken` box. Props: `selectedValue`, `onValueChange`, `size: 'sm' | 'md' | 'lg'`, `variant` (`rounded` → pill), `disabled`; items via `<Select.Item label value />`.

### FormControl

`isRequired` adds a red ` *` to the label. Subcomponents: `FormControlLabel(Text)` (13 / 600, `soft`), `FormControlHelper(Text)` (`muted`), `FormControlError(Text)` (`err-fg`).

---

## Layout & Typography

- **Box**, **Center**, **VStack / HStack** (`gap?: number` — prefer `className="gap-n"`, runtime `gap-${n}` is only generated if the class exists literally somewhere), **Divider** (`bg-line`, `orientation`).
- **Text** — `variant: 'default' | 'muted' | 'small' | 'large' | 'bold'`, `size`. Onest, `text-ink`. For STHM text styles pass `className="type-body-strong text-ink"`.
- **Heading** — `level: 1–4`, Onest bold / semibold, `text-ink`.

---

## Overlays

- **Modal** — `visible`, `onClose`, `showCloseButton`, `closeOnBackdropPress`, `animationType`. `scrim` backdrop, `bg-card rounded-2xl p-6`.
- **AlertDialog** — `isOpen`, `onClose`, `size: 'sm' | 'md' | 'lg' | 'full'` + `AlertDialogContent/Header/Body/Footer`.
- **Sheet** (`components/base/Sheet.tsx`, `@gorhom/bottom-sheet`) — `isOpen` / `onClose`, `size` `'full'` | `'half'` | `'auto'`. Inside it use `SheetScrollView`, `SheetFlatList`, `SheetTextInput`. Don't use `@expo/ui` `BottomSheet` (empty on Android).

---

## Feedback

- **Spinner** — `size: 'sm' | 'md' | 'lg'` (`md`/`lg` → native `large`), `color` (default theme `ink`).
- `components/common`: **EmptyState** (`message`, `description?`, `icon?`, `card?`, `children` for actions), **LoadingState** (`message?`).

---

## Outside `base/`

- `components/brand`: **Logo** (`variant: 'horizontal' | 'icon'`, `width`, `onDark?` — official SVGs via `react-native-svg`), **SplashView** (in-app splash while the session is restored).
- `components/navigation`: **BottomNav** (floating tab bar) + `useBottomNavInset()`.
- `components/common`: **ComingSoonScreen** (`title`, `description?`, `icon?`) — header with back + «Скоро будет доступно» for routes whose feature isn't built yet.
- `components/product`: `ProductCard` (ListCard row), `ProductCardSkeleton`, `ProductImage` (thumbnail with placeholder fallback), `ImageCarousel` (photo gallery, `overlay` for back/edit buttons), `ProductVariantCard`.
- `components/order`: `OrderItemCard`, `SwipeableOrderItemCard` (swipe left → delete), `ProductSearchSheet`.
- `components/cashbox`: `FilterSheet` (placeholder), type `CashboxStatusFilter`.
- `src/icons/custom-icon.tsx`: `CustomIcon({ name, size?, color? })` — SF Symbols / Material Symbols.

---

**Last Updated**: 2026-10-19 (redesign stage 3)
