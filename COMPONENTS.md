# Base Components — Quick Reference

> Custom components in `src/components/base/`, built on React Native + NativeWind.
> Styling rules and tokens: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

> ⚠️ These components still have their pre-STHM look (they use the legacy color aliases). They are rewritten to the STHM design in redesign stage 1 — this page documents the **current** API.

---

## Import

```tsx
import { Box, Button, Input, InputField, Text, VStack } from '@/components/base';
```

Every component's `*Props` type is exported too.

---

## Layout

**Box** — `View` with `className`.
```tsx
<Box className="p-4 bg-card rounded-xl">…</Box>
```

**VStack / HStack** — `flex-col` / `flex-row`. Props: `gap?: number`, `className?`.
```tsx
<VStack gap={4}>…</VStack>
<HStack className="gap-3 items-center">…</HStack>
```
> `gap={n}` builds the class `gap-${n}` at runtime; Tailwind only generates it if `gap-n` also appears literally somewhere in the source. Prefer `className="gap-n"`.

**Center** — `View` with `items-center justify-center`.

**Divider** — `orientation?: 'horizontal' | 'vertical'` (default `horizontal`), `bg-border`, 1px.

---

## Typography

**Text** — `variant?: 'default' | 'muted' | 'small' | 'large' | 'bold'` (default `default`), `size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'`. Uses Onest.
```tsx
<Text>Regular</Text>
<Text variant="muted">Secondary</Text>
<Text className="type-body-strong text-ink">STHM text style</Text>
```

**Heading** — `level?: 1 | 2 | 3 | 4` (default `2`): 30 / 24 / 20 / 18 px, Onest bold / semibold, `accessibilityRole="header"`.

---

## Interactive

**Button**

| Prop | Type | Default |
|---|---|---|
| `variant` | `'default' \| 'outline' \| 'ghost' \| 'destructive'` | `'default'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `loading` | `boolean` | `false` |
| `textClassName` | `string` | — |
| `children` | `ReactNode` (required) | — |

- A **string child** is wrapped in `Text` automatically. Other children render as-is.
- `loading` disables the button and shows `ActivityIndicator`.
- `ButtonText` and `ButtonIcon` (`as`, `size`, `color`) are available for custom content.

```tsx
<Button onPress={save} loading={isSaving}>Сохранить</Button>
<Button variant="outline" size="sm">Отмена</Button>
```

**Pressable** — RN `Pressable` + `className`, `active:opacity-70`, `opacity-50` when disabled, `accessibilityRole="button"`.

---

## Forms

**Input + InputField** — `Input` is a container `View`; `InputField` is the `TextInput`.

| `Input` prop | Type | Default |
|---|---|---|
| `variant` | `'outline' \| 'underlined' \| 'rounded'` | `'outline'` |
| `size` | `'sm' \| 'md' \| 'lg'` (40 / 48 / 56 px) | `'md'` |

```tsx
<Input size="lg">
  <InputField placeholder="Логин" value={login} onChangeText={setLogin} />
</Input>
```
> `placeholder`, `value`, `onChangeText`, `editable` go on **`InputField`**, not `Input`. There is no `error` prop.

**TextArea** — `TextInput`, always multiline. `size?: 'sm' | 'md' | 'lg'`, `error?: boolean`, `rows?: number` (default 3).

**Select** — wraps `@react-native-picker/picker` (Android dropdown, iOS wheel).
```tsx
<Select selectedValue={value} onValueChange={setValue} variant="outline" size="md">
  <Select.Item label="Склад 1" value="w1" />
</Select>
```
Props: `selectedValue`, `onValueChange`, `variant: 'outline' | 'underlined' | 'rounded'`, `size: 'sm' | 'md' | 'lg'`, `disabled`.

**FormControl** — `isInvalid`, `isRequired`, `isDisabled` + `FormControlLabel(Text)`, `FormControlHelper(Text)`, `FormControlError(Text)`. `isRequired` adds ` *` to the label. (`isInvalid` / `isDisabled` are not yet used by subcomponents.)

---

## Overlays

**Modal** — RN `Modal`, transparent, fade by default.

| Prop | Type | Default |
|---|---|---|
| `visible` | `boolean` (required) | — |
| `onClose` | `() => void` | — |
| `showCloseButton` | `boolean` | `false` |
| `closeOnBackdropPress` | `boolean` | `true` |
| `animationType` | `'none' \| 'fade' \| 'slide'` | `'fade'` |

**AlertDialog** — `isOpen`, `onClose`, `size` (currently ignored) + `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogBody`, `AlertDialogFooter`.

**BottomSheet** — not a base component; use `@expo/ui` directly (controlled):
```tsx
import { BottomSheet } from '@expo/ui';

<BottomSheet isPresented={open} onDismiss={() => setOpen(false)} snapPoints={['half', 'full']}>
  <Box className="flex-1 p-4">…</Box>
</BottomSheet>
```

---

## Display & Feedback

**Card** — `variant?: 'default' | 'elevated'`; `bg-card rounded-xl p-4` with a shadow. (STHM design has no shadows — changes in stage 1.)

**Badge / BadgeText** — `variant: 'solid' | 'outline'`, `action: 'success' | 'error' | 'warning' | 'info' | 'muted'`, `size: 'sm' | 'md' | 'lg'`. Uses palette classes that don't exist in the theme — replaced by `StatusBadge` in stage 1.

**Avatar / AvatarImage / AvatarFallbackText** — `size: 'sm' | 'md' | 'lg' | 'xl'` (32 / 48 / 64 / 96 px); fallback shows up to 2 initials.

**Spinner** — `size: 'sm' | 'md' | 'lg'` (`md` and `lg` both render `large`), `color` (default `#171717`).

**Icons** — lucide re-exports: `ArrowUpIcon`, `ArrowDownIcon`, `ChevronUp/Down/Left/RightIcon`, `CloseIcon`, `CheckIcon`. Props: `size`, `color`, `strokeWidth`.

---

## Outside `base/`

- `components/common`: `EmptyState({ message })`, `LoadingState({ message? })`.
- `components/product`: `ProductCard`, `ProductCardSkeleton`, `ProductVariantCard`, `ProductImage`, `ImageCarousel`, `PriceLabel`, `PricePair`, `QuantityStepper`, `ChipSelector`, `AvailabilityBadge`, `SearchBar`, `ProductListHeader`, `EmptyProductList`, `ActionButtons`, `AdminSectionHeader`.
- `components/order`: `OrderCard`, `SwipeableOrderCard`, `OrderItemCard`, `SwipeableOrderItemCard`, `OrderInfoCard`, `OrderPaymentCard`, `ProductSearchSheet`.
- `components/cashbox`: `CashboxHeader`, `CashboxFilters`, `StatusBadge`, `FilterSheet` (not exported from `index.ts`).
- `src/icons/custom-icon.tsx`: `CustomIcon({ name: IconNames, size?, color? })` — SF Symbols / Material Symbols.

---

## Tips

1. Use tokens (`bg-card`, `text-ink`) — never hex colors.
2. Merge classes with `cn()` from `@/libs/utils`.
3. See `src/components/base/EXAMPLES.md` and the `/component-demo` screen.

---

**Last Updated**: 2026-10-19
