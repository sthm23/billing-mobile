# Order Card Components

Компоненты карточек заказов с функционалом swipe-to-delete для проекта billing-mobile.

## Компоненты

### OrderCard

Базовый компонент карточки заказа с отображением всей информации.

**Props:**
- `order: Order` - объект заказа
- `onPress?: () => void` - колбэк при нажатии на карточку (опционально)

**Функции:**
- Отображает статус заказа с цветовым индикатором
- Показывает дату и время создания
- Отображает информацию о кассире и клиенте
- Показывает сумму заказа и оплаченную сумму
- Индикатор канала заказа (POS/Online)

### SwipeableOrderCard

Обертка для OrderCard с функционалом свайпа для удаления.

**Props:**
- `order: Order` - объект заказа
- `onDelete?: (orderId: string) => void` - колбэк при удалении
- `onPress?: () => void` - колбэк при нажатии на карточку

**Функции:**
- Свайп влево открывает кнопку удаления
- Красная кнопка с иконкой корзины
- Плавная анимация появления/скрытия
- Автоматическое закрытие после удаления

## Использование

### Базовый пример

```tsx
import { SwipeableOrderCard } from '@/components/order';

function OrderList() {
  const orders = [...]; // массив заказов

  const handleDelete = (orderId: string) => {
    console.log('Удалить заказ:', orderId);
    // Логика удаления через API
  };

  const handlePress = (orderId: string) => {
    console.log('Открыть заказ:', orderId);
    // Навигация к деталям заказа
  };

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SwipeableOrderCard
          order={item}
          onDelete={handleDelete}
          onPress={() => handlePress(item.id)}
        />
      )}
    />
  );
}
```

### Без функции удаления

```tsx
import { OrderCard } from '@/components/order';

function OrderDetails({ order }) {
  return <OrderCard order={order} />;
}
```

## Статусы заказов

| Статус | Цвет | Текст |
|--------|------|-------|
| COMPLETED | Зеленый | Завершен |
| CREATED | Синий | Создан |
| HOLD | Желтый | В ожидании |
| CANCELLED | Красный | Отменен |
| DEBT | Оранжевый | Долг |
| REFUNDED | Серый | Возврат |

## Форматирование

### Дата
Формат: `DD.MM.YYYY HH:MM`
Пример: `23.09.2026 14:30`

### Сумма
Формат: русский формат с разделителями тысяч
Пример: `1 234 567 UZS`

## Зависимости

- `react-native-gesture-handler` - для swipe жестов
- `@/components/ui/*` - UI компоненты проекта
- `react-i18next` - для локализации

## Стилизация

Компоненты используют NativeWind (Tailwind CSS) для стилизации:
- `bg-card` - фон карточки
- `border-outline-200` - цвет границы
- `text-foreground` - основной текст
- `text-typography-*` - цвета текста разных уровней
- `rounded-xl` - скругление углов

## TODO

- [ ] Добавить интеграцию с API удаления
- [ ] Добавить анимацию удаления карточки
- [ ] Добавить подтверждение удаления (диалог)
- [ ] Добавить тост-уведомление после удаления
- [ ] Добавить возможность отмены удаления (undo)
- [ ] Добавить навигацию к деталям заказа
- [ ] Добавить локализацию статусов
