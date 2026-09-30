# Migration Guide — от GlueStack UI к Base Components

> **Статус:** ✅ Все базовые компоненты созданы и готовы к использованию

---

## 📊 Что было сделано

### ✅ Созданные компоненты (17 шт)

**Layout (5):**
- `Box` — базовый контейнер (замена View)
- `VStack` — вертикальный стек с gap
- `HStack` — горизонтальный стек с gap
- `Center` — центрирование
- `Divider` — разделитель

**Typography (2):**
- `Text` — текст с вариантами (default, muted, small, large, bold)
- `Heading` — заголовки (level 1-4)

**Interactive (2):**
- `Button` — кнопка с вариантами (default, outline, ghost, destructive)
- `Pressable` — кликабельный элемент

**Forms (2):**
- `Input` — текстовое поле (sizes: sm, md, lg; error state)
- `TextArea` — многострочный ввод

**Feedback (3):**
- `Card` — карточка (default, elevated)
- `Divider` — разделитель (horizontal, vertical)
- `Spinner` — индикатор загрузки

**Overlays (2):**
- `Modal` — модальное окно
- `BottomSheet` — нижняя панель (@gorhom/bottom-sheet)

### ✅ Дополнительно созданные файлы

- `DESIGN_SYSTEM.md` — единый источник правды для стилей
- `src/components/base/` — 17 компонентов
- `src/components/base/index.ts` — экспорты
- `src/components/base/EXAMPLES.md` — примеры использования
- `src/app/component-demo.tsx` — демо экран для тестирования
- `MIGRATION_GUIDE.md` — этот файл

---

## 🧪 Тестирование

### 1. Запустите демо экран

```bash
npm start
```

Откройте `/component-demo` в приложении, чтобы увидеть все компоненты в действии.

**Проверьте:**
- ✅ Light mode
- ✅ Dark mode (переключите в настройках устройства)
- ✅ Все интеракции работают (кнопки, инпуты, модалы)
- ✅ Стили консистентны

---

## 📝 Как мигрировать экраны

### Шаг 1: Замените импорты

**Было (GlueStack):**
```tsx
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
```

**Стало (Base Components):**
```tsx
import { Box, Text, Button, VStack } from '@/components/base';
```

### Шаг 2: Упростите структуру

**Было:**
```tsx
<Button>
  <ButtonText>Click Me</ButtonText>
</Button>
```

**Стало:**
```tsx
<Button>Click Me</Button>
```

### Шаг 3: Обновите пропсы

**Было:**
```tsx
<Button action="primary" size="md">
  <ButtonText>Submit</ButtonText>
</Button>
```

**Стало:**
```tsx
<Button variant="default" size="md">
  Submit
</Button>
```

---

## 🔄 Маппинг компонентов

| GlueStack UI | Base Component | Изменения |
|-------------|---------------|-----------|
| `<Box>` | `<Box>` | Без изменений |
| `<VStack space={8}>` | `<VStack gap={2}>` | `space` → `gap` (Tailwind scale) |
| `<HStack space={8}>` | `<HStack gap={2}>` | `space` → `gap` |
| `<Text>` | `<Text>` | Добавлены варианты (muted, small, etc.) |
| `<Heading>` | `<Heading>` | Добавлен `level` prop |
| `<Button><ButtonText>` | `<Button>text</Button>` | Проще API |
| `<Input>` | `<Input>` | Добавлен `error` prop |
| `<Card>` | `<Card>` | Добавлен `variant` prop |

---

## 📋 План миграции экранов

### Приоритет 1: Простые экраны (начните с них)

1. **Login экран** (`src/screens/login/LoginPage.tsx`)
   - Использует: Input, Button, VStack, Text
   - Простой, без сложных компонентов
   - ✅ Рекомендуется мигрировать первым

2. **Order Card** (`src/screens/order/OrderCard.tsx`)
   - Использует: Card, VStack, HStack, Text, Pressable
   - Тестирование Cards и layout компонентов

### Приоритет 2: Средней сложности

3. **Cashbox List** (`src/screens/payment/CashboxListPage.tsx`)
   - Использует: FlatList + Cards
   - Проверка списков с новыми компонентами

4. **Order Detail** (`src/screens/order/OrderDetailScreen.tsx`)
   - Использует: Multiple components
   - Более сложный экран

### Приорит 3: Сложные компоненты

5. **Product Search Sheet** (`src/components/order/ProductSearchSheet.tsx`)
   - Использует: BottomSheet, FlatList, Input
   - Самый сложный, тестирует BottomSheet

---

## 🎯 Пошаговая инструкция (Login экран)

### 1. Откройте файл

```
src/screens/login/LoginPage.tsx
```

### 2. Замените импорты

**Найдите:**
```tsx
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
```

**Замените на:**
```tsx
import { Box, Button, Input, VStack, Text, Heading } from '@/components/base';
```

### 3. Упростите Button

**Найдите:**
```tsx
<Button>
  <ButtonText>Login</ButtonText>
</Button>
```

**Замените на:**
```tsx
<Button>Login</Button>
```

### 4. Упростите Input

**Найдите:**
```tsx
<Input>
  <InputField placeholder="Email" />
</Input>
```

**Замените на:**
```tsx
<Input placeholder="Email" />
```

### 5. Обновите gap/space

**Найдите:**
```tsx
<VStack space={16}>
```

**Замените на:**
```tsx
<VStack gap={4}>  {/* 16px = gap-4 в Tailwind */}
```

### 6. Протестируйте

```bash
npm start
```

Откройте login экран и проверьте:
- ✅ Стили выглядят правильно
- ✅ Инпуты работают
- ✅ Кнопка кликается
- ✅ Dark mode работает

---

## ⚠️ Частые проблемы

### 1. "Cannot find module '@/components/base'"

**Решение:** Убедитесь, что путь правильный:
```tsx
import { Button } from '@/components/base';
```

### 2. Gap не работает

**Проблема:**
```tsx
<VStack gap={16}>  ❌ Неправильно
```

**Решение:**
```tsx
<VStack gap={4}>  ✅ Правильно (Tailwind scale: 4 = 16px)
```

### 3. Button не принимает children string

**Проблема:**
```tsx
<Button>
  <ButtonText>Click</ButtonText>  ❌ Старый API
</Button>
```

**Решение:**
```tsx
<Button>Click</Button>  ✅ Новый API
```

---

## 🗑️ Удаление GlueStack UI (последний шаг)

**⚠️ Выполняйте ТОЛЬКО ПОСЛЕ миграции всех экранов!**

### 1. Проверьте, что все экраны мигрированы

```bash
# Найти все импорты GlueStack
grep -r "from '@/components/ui" src/
```

Если команда ничего не выводит — можно удалять.

### 2. Удалите зависимости

```bash
npm uninstall @gluestack-ui/core @gluestack-ui/utils
```

### 3. Удалите старые компоненты

```bash
rm -rf src/components/ui/
```

### 4. Очистите package.json

Проверьте, что удалены:
- `@gluestack-ui/core`
- `@gluestack-ui/utils`

### 5. Финальный тест

```bash
npm start
# Проверьте все экраны в приложении
```

---

## 📈 Прогресс миграции

**Компоненты:** ✅ 17/17 (100%)  
**Экраны:** ✅ 7/12 (58%)

### Чек-лист экранов

- [ ] Login экран
- [x] Order Card (components/order/OrderCard.tsx)
- [x] Order Card Menu (screens/order/OrderCardMenu.tsx)
- [x] Order List (OrderPage)
- [x] Order Detail (OrderDetailScreen.tsx) - Icon imports fixed
- [ ] Cashbox List
- [ ] Cashbox Details
- [ ] Payment screens
- [x] Product Search Sheet - Icon imports fixed
- [ ] Swipeable Order Card
- [ ] Order Info Card
- [x] Search Screen (search.tsx)
- [x] Scan Screen (scan.tsx)

---

## 🎨 Design System

Все компоненты следуют единому [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md):

- ✅ Semantic colors (не хардкод)
- ✅ Spacing scale (Tailwind)
- ✅ Dark mode support
- ✅ TypeScript
- ✅ Accessibility
- ✅ Консистентный API

---

## 💡 Советы

1. **Мигрируйте по одному экрану** — не пытайтесь все сразу
2. **Тестируйте после каждого экрана** — убедитесь, что работает
3. **Используйте демо экран** — проверяйте стили компонентов
4. **Сохраняйте коммиты** — чтобы можно было откатить изменения
5. **Проверяйте обе темы** — light и dark mode

---

## 🚀 Следующие шаги

1. ✅ Протестируйте демо экран: `/component-demo`
2. ⏳ Мигрируйте Login экран (самый простой)
3. ⏳ Мигрируйте остальные экраны по приоритету
4. ⏳ Удалите GlueStack UI зависимости
5. ⏳ Создайте PR с изменениями

---

**Вопросы?** Проверьте:
- `DESIGN_SYSTEM.md` — правила дизайна
- `src/components/base/EXAMPLES.md` — примеры использования
- `src/app/component-demo.tsx` — живые примеры

**Удачной миграции!** 🎉
