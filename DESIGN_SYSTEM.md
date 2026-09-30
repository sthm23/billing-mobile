# Design System — Billing Mobile

> **Единый источник правды для всех UI компонентов**

---

## 🎨 Принципы дизайна

1. **Простота** — компоненты должны быть понятными и легкими в использовании
2. **Консистентность** — единый стиль во всем приложении
3. **Accessibility** — доступность для всех пользователей
4. **Performance** — быстрая работа на любых устройствах
5. **Native First** — использовать нативные компоненты React Native

---

## 🎨 Цветовая палитра

Используется **dual theme** (light/dark) из `src/global.css`.

### Semantic Colors

```typescript
// Light Mode
primary: rgb(23, 23, 23)           // #171717 - основной цвет
primary-foreground: rgb(250, 250, 250)  // #FAFAFA - текст на primary
background: rgb(255, 255, 255)     // #FFFFFF - фон
foreground: rgb(10, 10, 10)        // #0A0A0A - основной текст
card: rgb(255, 255, 255)           // #FFFFFF - карточки
border: rgb(229, 229, 229)         // #E5E5E5 - границы
input: rgb(229, 229, 229)          // #E5E5E5 - поля ввода
muted: rgb(245, 245, 245)          // #F5F5F5 - приглушенный фон
muted-foreground: rgb(115, 115, 115)  // #737373 - приглушенный текст
accent: rgb(247, 247, 247)         // #F7F7F7 - акценты
destructive: rgb(231, 0, 11)       // #E7000B - ошибки/удаление

// Dark Mode
primary: rgb(255, 245, 245)        // #FFF5F5
background: rgb(10, 10, 10)        // #0A0A0A
foreground: rgb(250, 250, 250)     // #FAFAFA
card: rgb(23, 23, 23)              // #171717
border: rgb(46, 46, 46)            // #2E2E2E
destructive: rgb(255, 100, 103)    // #FF6467
```

### Использование в компонентах

```tsx
// ✅ Правильно — использовать Tailwind классы
<View className="bg-background border-border">
  <Text className="text-foreground">Hello</Text>
</View>

// ❌ Неправильно — хардкодить цвета
<View style={{ backgroundColor: '#FFFFFF' }}>
  <Text style={{ color: '#000000' }}>Hello</Text>
</View>
```

---

## 📏 Spacing Scale

Используйте Tailwind spacing:

```typescript
// Padding/Margin Scale
0.5 = 2px   // очень маленький
1   = 4px   // маленький
2   = 8px   // средний-маленький
3   = 12px  // средний
4   = 16px  // стандартный (базовый)
5   = 20px  // средний-большой
6   = 24px  // большой
8   = 32px  // очень большой
12  = 48px  // extra большой

// Примеры
p-4  = padding: 16px (стандартный для карточек)
px-6 = padding-horizontal: 24px
gap-3 = gap: 12px
```

### Рекомендации

- **Карточки/Контейнеры:** `p-4` (16px)
- **Экраны:** `p-6` (24px)
- **Кнопки:** `px-4 py-2` (16px/8px)
- **Иконки:** `p-2` или `p-3` (8px/12px)
- **Gap между элементами:** `gap-2` или `gap-3` (8px/12px)

---

## 🔤 Typography

### Font Sizes

```typescript
text-xs   = 12px  // очень маленький
text-sm   = 14px  // маленький
text-base = 16px  // базовый (по умолчанию)
text-lg   = 18px  // большой
text-xl   = 20px  // очень большой
text-2xl  = 24px  // заголовок
text-3xl  = 30px  // большой заголовок
```

### Font Weights

```typescript
font-normal    = 400  // обычный текст
font-medium    = 500  // средний (подзаголовки)
font-semibold  = 600  // полужирный (акценты)
font-bold      = 700  // жирный (заголовки)
```

### Компоненты

- **Заголовки:** `text-2xl font-bold` или `text-xl font-semibold`
- **Основной текст:** `text-base font-normal`
- **Описания:** `text-sm text-muted-foreground`
- **Лейблы:** `text-sm font-medium`
- **Цены/числа:** `text-lg font-bold`

---

## 🎯 Border Radius

```typescript
rounded-none = 0px
rounded-sm   = 2px
rounded      = 4px   // стандартный
rounded-md   = 6px
rounded-lg   = 8px   // кнопки
rounded-xl   = 12px  // карточки
rounded-2xl  = 16px  // большие карточки
rounded-full = 9999px // круглые элементы
```

### Рекомендации

- **Кнопки:** `rounded-lg` (8px)
- **Карточки:** `rounded-xl` (12px)
- **Инпуты:** `rounded-lg` (8px)
- **Аватары:** `rounded-full`
- **Модальные окна:** `rounded-2xl` (16px)

---

## 🎨 Shadows

```typescript
// iOS-style тени
shadow-sm  // маленькая тень
shadow     // средняя тень (по умолчанию)
shadow-md  // средняя-большая
shadow-lg  // большая

// Для карточек
className="bg-card rounded-xl shadow-sm"
```

**Android:** Используйте `elevation` вместо `shadow`:

```tsx
<View style={{ elevation: 2 }} className="bg-card">
```

---

## 📦 Component Guidelines

### 1. Именование компонентов

```
src/components/base/
  ├── Box.tsx           // Layout container
  ├── Text.tsx          // Text component
  ├── Button.tsx        // Button with variants
  ├── Input.tsx         // Text input
  └── ...
```

### 2. Структура компонента

```tsx
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface BoxProps extends ViewProps {
  // Дополнительные пропсы
}

/**
 * Box — базовый layout контейнер
 * 
 * @example
 * <Box className="p-4 bg-card rounded-xl">
 *   <Text>Content</Text>
 * </Box>
 */
export function Box({ className, ...props }: BoxProps) {
  return (
    <View 
      className={cn('bg-background', className)} 
      {...props} 
    />
  );
}
```

### 3. Обязательные элементы

- ✅ TypeScript интерфейс с расширением нативного типа
- ✅ JSDoc комментарий с примером использования
- ✅ Использование `cn()` для объединения className
- ✅ Forwarding props (`...props`)
- ✅ Дефолтные стили через Tailwind

### 4. Variants (если нужны)

Используйте `tailwind-variants` для компонентов с вариантами:

```tsx
import { tv, type VariantProps } from 'tailwind-variants';

const buttonVariants = tv({
  base: 'rounded-lg flex-row items-center justify-center gap-2',
  variants: {
    variant: {
      default: 'bg-primary',
      outline: 'border border-border bg-background',
      ghost: 'bg-transparent',
    },
    size: {
      sm: 'px-3 py-1.5',
      md: 'px-4 py-2',
      lg: 'px-6 py-3',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  // ...
}
```

---

## 🧩 Component Checklist

При создании нового компонента проверьте:

- [ ] Расширяет соответствующий React Native тип (ViewProps, TextProps, etc.)
- [ ] Использует semantic colors из global.css (не хардкод)
- [ ] Поддерживает dark mode (через Tailwind классы)
- [ ] Использует spacing scale (p-4, gap-3, etc.)
- [ ] Имеет TypeScript интерфейс с экспортом
- [ ] Использует `cn()` для объединения className
- [ ] Имеет JSDoc комментарий с примером
- [ ] Forwarding всех props (`...props`)
- [ ] Accessibility (accessibilityLabel, accessibilityRole)
- [ ] Тестирование на iOS и Android

---

## 🎨 Компонентная библиотека

### Базовые компоненты (Layer 1)

**Layout:**
- `Box` — базовый контейнер
- `VStack` — вертикальный стек
- `HStack` — горизонтальный стек
- `Center` — центрирование
- `Divider` — разделитель

**Typography:**
- `Text` — текст с вариантами
- `Heading` — заголовки

**Interactive:**
- `Pressable` — кликабельный элемент
- `Button` — кнопка с вариантами
- `IconButton` — кнопка с иконкой

**Forms:**
- `Input` — текстовый инпут
- `TextArea` — многострочный инпут
- `Label` — лейбл для форм

**Feedback:**
- `Spinner` — индикатор загрузки
- `Toast` — уведомления

### Сложные компоненты (Layer 2)

- `Card` — карточка с контентом
- `Modal` — модальное окно
- `BottomSheet` — нижняя панель
- `Avatar` — аватар
- `Badge` — бейдж
- `Alert` — алерт

---

## 🚀 Миграция с GlueStack

### Маппинг компонентов

```tsx
// Было (GlueStack)
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';

<Box className="p-4">
  <Text>Hello</Text>
  <Button>
    <ButtonText>Click</ButtonText>
  </Button>
</Box>

// Стало (Native)
import { Box, Text, Button } from '@/components/base';

<Box className="p-4">
  <Text>Hello</Text>
  <Button>Click</Button>
</Box>
```

### Ключевые отличия

1. **Проще структура** — Button не требует вложенного ButtonText
2. **Меньше импортов** — один компонент = один импорт
3. **Чистый React Native** — понятнее, что происходит
4. **Легче кастомизация** — прямой доступ к View/Text/Pressable

---

## 📚 Примеры использования

### Карточка продукта

```tsx
<Box className="bg-card rounded-xl p-4 shadow-sm gap-3">
  <Text className="text-lg font-bold">Product Name</Text>
  <Text className="text-sm text-muted-foreground">Description</Text>
  <HStack className="justify-between items-center">
    <Text className="text-xl font-bold">$99.99</Text>
    <Button size="sm">Add to Cart</Button>
  </HStack>
</Box>
```

### Форма

```tsx
<VStack className="p-6 gap-4">
  <Heading>Login</Heading>
  
  <VStack className="gap-2">
    <Label>Email</Label>
    <Input placeholder="Enter email" />
  </VStack>
  
  <VStack className="gap-2">
    <Label>Password</Label>
    <Input secureTextEntry placeholder="Enter password" />
  </VStack>
  
  <Button>Sign In</Button>
</VStack>
```

---

## 🎯 Best Practices

1. **Всегда используйте semantic colors** — `text-foreground` вместо `text-black`
2. **Используйте spacing scale** — `p-4` вместо `style={{ padding: 15 }}`
3. **Группируйте импорты** — все base компоненты вместе
4. **Не злоупотребляйте вариантами** — максимум 3-4 варианта
5. **Тестируйте на обеих темах** — light и dark
6. **Accessibility** — всегда добавляйте accessibilityLabel для интерактивных элементов
7. **Переиспользуйте** — если делаете похожий компонент 3 раза, создайте общий

---

**Last updated**: 2026-09-30  
**Version**: 1.0
