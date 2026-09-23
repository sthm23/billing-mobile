# Order Screens

Экраны для работы с заказами в приложении billing-mobile.

## Структура

### OrderPage
**Путь:** `src/screens/order/OrderPage.tsx`  
**Роут:** `/(tabs)/(orders)/index`

Главная страница со списком заказов.

**Функции:**
- Список заказов с пагинацией
- Фильтрация по статусам (Active/Completed)
- Поиск по заказам
- Swipe-to-delete функционал
- Переход к деталям заказа по клику

**Компоненты:**
- `SwipeableOrderCard` - карточка заказа с возможностью удаления свайпом

---

### OrderDetailScreen
**Путь:** `src/screens/order/OrderDetailScreen.tsx`  
**Роут:** `/(tabs)/(orders)/[id]`

Детальная информация о заказе.

**Функции:**
- Полная информация о заказе
- Список товаров с ценами и скидками
- История платежей
- Дополнительные услуги
- Информация о возвратах
- Кнопки редактирования и удаления

**Секции:**
1. **Header** - навигация, ID заказа, кнопки действий
2. **Status Banner** - цветной баннер со статусом
3. **Order Info** - дата, кассир, клиент, склад
4. **Items** - список товаров с деталями
5. **Services** - дополнительные услуги (если есть)
6. **Payments** - история платежей (если есть)
7. **Total** - итоговая сумма с расчетами
8. **Return Info** - информация о возврате (если есть)

**Компоненты:**
- `OrderInfoCard` - карточка с информацией
- `OrderItemCard` - карточка товара
- `OrderPaymentCard` - карточка платежа

---

## Навигация

### Из списка в детали
```tsx
// OrderPage.tsx
const handleOrderPress = (orderId: string) => {
  router.push(`/(tabs)/(orders)/${orderId}`);
};
```

### Из деталей назад
```tsx
// OrderDetailScreen.tsx
const handleBack = () => {
  router.back();
};
```

---

## API Integration

### Получение списка заказов
```tsx
const { data, isLoading, isError } = useOrders({
  currentPage: 1,
  pageSize: 10,
  status: [OrderStatus.CREATED, OrderStatus.HOLD],
  search: 'search text',
});
```

### Получение деталей заказа
```tsx
const { data: order, isLoading, isError } = useOrderById(orderId);
```

---

## Компоненты

### OrderCard
Базовая карточка заказа (без swipe).

**Props:**
- `order: Order` - данные заказа
- `onPress?: () => void` - обработчик нажатия

### SwipeableOrderCard
Карточка с swipe-функционалом.

**Props:**
- `order: Order` - данные заказа
- `onDelete?: (orderId: string) => void` - обработчик удаления
- `onPress?: () => void` - обработчик нажатия

### OrderInfoCard
Карточка с информационными полями.

**Props:**
```tsx
{
  title: string;
  items: Array<{ label: string; value: string }>;
}
```

### OrderItemCard
Карточка товара в заказе.

**Props:**
```tsx
{
  item: OrderDetailItem;
  index: number;
  showDivider: boolean;
}
```

### OrderPaymentCard
Карточка платежа.

**Props:**
```tsx
{
  payment: OrderPayment;
}
```

---

## Статусы заказов

| Статус | Цвет | Описание |
|--------|------|----------|
| CREATED | Синий | Заказ создан |
| HOLD | Желтый | В ожидании |
| COMPLETED | Зеленый | Завершен |
| DEBT | Оранжевый | Долг |
| CANCELLED | Красный | Отменен |
| REFUNDED | Серый | Возврат |

---

## Типы платежей

| Тип | Иконка | Название |
|-----|--------|----------|
| CASH | 💵 | Наличные |
| CARD | 💳 | Карта |
| ONLINE | 🌐 | Онлайн |
| TRANSFER | 🔄 | Перевод |

---

## TODO

### OrderPage
- [ ] Реализовать удаление заказа через API
- [ ] Добавить подтверждение удаления
- [ ] Добавить toast уведомления
- [ ] Добавить pull-to-refresh
- [ ] Добавить бесконечную прокрутку (pagination)

### OrderDetailScreen
- [ ] Реализовать редактирование заказа
- [ ] Реализовать удаление заказа
- [ ] Добавить возможность добавления платежа
- [ ] Добавить возможность возврата товаров
- [ ] Добавить печать чека
- [ ] Добавить экспорт в PDF
- [ ] Добавить историю изменений заказа

---

## Примеры использования

### Базовое использование списка
```tsx
import { OrderPage } from '@/screens/order/OrderPage';

export default function OrdersScreen() {
  return <OrderPage />;
}
```

### Переход к деталям
```tsx
import { router } from 'expo-router';

// В любом компоненте
const openOrderDetails = (orderId: string) => {
  router.push(`/(tabs)/(orders)/${orderId}`);
};
```

### Кастомная обработка удаления
```tsx
const handleDelete = async (orderId: string) => {
  try {
    await orderService.deleteOrder(orderId);
    showToast({ type: 'success', message: 'Заказ удален' });
  } catch (error) {
    showToast({ type: 'error', message: 'Ошибка удаления' });
  }
};
```
