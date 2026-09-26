import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import { ArrowLeftIcon, EditIcon, TrashIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { OrderInfoCard, OrderItemCard, OrderPaymentCard } from '@/components/order';
import { useOrderById } from '@/services/order/order.queries';
import { OrderChannel, OrderStatus } from '@/services/order/order.type';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';

interface OrderDetailScreenProps {
  orderId: string;
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.COMPLETED:
      return 'bg-green-500';
    case OrderStatus.CREATED:
      return 'bg-blue-500';
    case OrderStatus.HOLD:
      return 'bg-yellow-500';
    case OrderStatus.CANCELLED:
      return 'bg-red-500';
    case OrderStatus.DEBT:
      return 'bg-orange-500';
    case OrderStatus.REFUNDED:
      return 'bg-gray-500';
    default:
      return 'bg-blue-500';
  }
};

const getStatusText = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.COMPLETED:
      return 'Завершен';
    case OrderStatus.CREATED:
      return 'Создан';
    case OrderStatus.HOLD:
      return 'В ожидании';
    case OrderStatus.CANCELLED:
      return 'Отменен';
    case OrderStatus.DEBT:
      return 'Долг';
    case OrderStatus.REFUNDED:
      return 'Возврат';
    default:
      return status;
  }
};


const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const { data: order, isLoading, isError } = useOrderById(orderId);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    console.log('Edit order:', orderId);
    // TODO: Navigate to edit screen
  };

  const handleDelete = () => {
    console.log('Delete order:', orderId);
    // TODO: Show confirmation dialog
  };

  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center">
        <Text className="text-lg">Загрузка...</Text>
      </Box>
    );
  }

  if (isError || !order) {
    return (
      <Box className="flex-1 items-center justify-center p-4">
        <Text className="text-lg text-red-500">Ошибка загрузки заказа</Text>
        <Button onPress={handleBack} className="mt-4">
          <ButtonText>Назад</ButtonText>
        </Button>
      </Box>
    );
  }

  const statusColor = getStatusColor(order.status);
  const statusText = getStatusText(order.status);
  const channelLabel = order.channel === OrderChannel.POS ? 'POS' : 'Online';

  return (
    <Box className="flex-1">
      {/* Header */}
      <Box className="bg-card border-b border-outline-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-3 flex-1">
            <Button variant="ghost" size="sm" onPress={handleBack}>
              <ButtonIcon as={ArrowLeftIcon} />
            </Button>
            <VStack className="flex-1">
              <Text className="text-lg font-bold text-foreground">
                Заказ #{order.id.slice(0, 8)}
              </Text>
              <Text className="text-sm text-typography-500">{channelLabel}</Text>
            </VStack>
          </HStack>
          <HStack className="gap-2">
            <Button variant="outline" size="sm" onPress={handleEdit}>
              <ButtonIcon as={EditIcon} />
            </Button>
            <Button variant="outline" size="sm" onPress={handleDelete}>
              <ButtonIcon as={TrashIcon} className="text-red-500" />
            </Button>
          </HStack>
        </HStack>
      </Box>

      <ScrollView className="flex-1">
        {/* Status Banner */}
        <Box className={`${statusColor} p-4`}>
          <Text className="text-white text-center font-semibold text-lg">
            {statusText}
          </Text>
        </Box>

        {/* Order Info */}
        <OrderInfoCard
          title="Информация о заказе"
          items={[
            { label: 'Дата создания', value: formatDate(order.createdAt) },
            { label: 'Кассир', value: order.cashier.fullName },
            ...(order.customer
              ? [{ label: 'Клиент', value: order.customer.user.fullName }]
              : []),
            { label: 'Склад', value: order.warehouse.name },
          ]}
        />

        {/* Items */}
        {'items' in order && order.items && order.items.length > 0 && (
          <Box className="bg-card m-4 mt-0 p-4 rounded-xl border border-outline-200 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-3">
              Товары ({order.items.length})
            </Text>

            <VStack className="gap-1">
              {order.items.map((item, index) => (
                <OrderItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  showDivider={index > 0}
                />
              ))}
            </VStack>
          </Box>
        )}

        {/* Additional Services */}
        {'services' in order && order.services && order.services.length > 0 && (
          <Box className="bg-card m-4 mt-0 p-4 rounded-xl border border-outline-200 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-3">
              Дополнительные услуги ({order.services.length})
            </Text>

            <VStack className="gap-3">
              {order.services.map((service) => (
                <HStack key={service.id} className="justify-between items-start">
                  <VStack className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {service.name}
                    </Text>
                    {service.description && (
                      <Text className="text-xs text-typography-500 mt-1">
                        {service.description}
                      </Text>
                    )}
                  </VStack>
                  <Box className="ml-3">
                    <Text className="text-base font-bold text-foreground">
                      {formatAmount(service.price)}
                    </Text>
                    <Text className="text-xs text-typography-400 text-right">
                      UZS
                    </Text>
                  </Box>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {/* Payments */}
        {'payments' in order && order.payments && order.payments.length > 0 && (
          <Box className="bg-card m-4 mt-0 p-4 rounded-xl border border-outline-200 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-3">
              Платежи ({order.payments.length})
            </Text>

            <VStack className="gap-1">
              {order.payments.map((payment) => (
                <OrderPaymentCard key={payment.id} payment={payment} />
              ))}
            </VStack>
          </Box>
        )}

        {/* Total Amount */}
        <Box className="bg-card m-4 mt-0 p-4 rounded-xl border border-outline-200 shadow-md">
          <VStack className="gap-3">
            <HStack className="justify-between items-center py-2">
              <Text className="text-lg font-semibold text-typography-600">
                Итого:
              </Text>
              <VStack className="items-end">
                <Text className="text-3xl font-bold text-foreground">
                  {formatAmount(order.totalAmount)}
                </Text>
                <Text className="text-sm text-typography-400">UZS</Text>
              </VStack>
            </HStack>

            {order.paidAmount > 0 && (
              <>
                <Divider />
                <HStack className="justify-between items-center py-1">
                  <Text className="text-sm text-typography-500">Оплачено:</Text>
                  <Text className="text-xl font-bold text-green-600">
                    {formatAmount(order.paidAmount)} UZS
                  </Text>
                </HStack>
              </>
            )}

            {order.paidAmount < order.totalAmount && (
              <>
                <Divider />
                <HStack className="justify-between items-center py-1">
                  <Text className="text-sm text-typography-500">
                    Осталось оплатить:
                  </Text>
                  <Text className="text-xl font-bold text-red-600">
                    {formatAmount(order.totalAmount - order.paidAmount)} UZS
                  </Text>
                </HStack>
              </>
            )}
          </VStack>
        </Box>

        {/* Return Info */}
        {order.isReturned && (
          <Box className="bg-red-50 dark:bg-red-950 m-4 mt-0 p-4 rounded-xl border border-red-200 dark:border-red-800">
            <Text className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
              Заказ возвращен
            </Text>
            <VStack className="gap-1">
              <Text className="text-xs text-red-600 dark:text-red-400">
                Сумма возврата: {formatAmount(order.returnedAmount)} UZS
              </Text>
              {order.returnedAt && (
                <Text className="text-xs text-red-600 dark:text-red-400">
                  Дата возврата: {formatDate(order.returnedAt)}
                </Text>
              )}
            </VStack>
          </Box>
        )}

        <Box className="h-4" />
      </ScrollView>
    </Box>
  );
}
