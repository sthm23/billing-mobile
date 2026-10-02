import { Box, Text } from '@/components/base';
import { Order, OrderStatus, OrderChannel } from '@/services/order/order.type';
import { useTranslation } from 'react-i18next';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
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

export function OrderCard({ order, onPress }: OrderCardProps) {
  const { t } = useTranslation();
  const statusColor = getStatusColor(order.status);

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return t('order.status.COMPLETED');
      case OrderStatus.CREATED:
        return t('order.status.CREATED');
      case OrderStatus.HOLD:
        return t('order.status.HOLD');
      case OrderStatus.CANCELLED:
        return t('order.status.CANCELLED');
      case OrderStatus.DEBT:
        return t('order.status.DEBT');
      case OrderStatus.REFUNDED:
        return t('order.status.REFUNDED');
      default:
        return status;
    }
  };

  const statusText = getStatusText(order.status);
  const channelLabel = order.channel === OrderChannel.POS ? 'POS' : 'Online';

  return (
    <Box className="relative p-4 m-2 border border-outline-200 rounded-xl bg-card shadow-sm">
      {/* Status Badge */}
      <Box className={`absolute top-0 right-0 ${statusColor} px-3 py-1.5 rounded-tr-xl rounded-bl-xl`}>
        <Text className="text-white text-sm font-medium">{statusText}</Text>
      </Box>

      {/* Order Content */}
      <Box className="pr-20">
        {/* Order ID and Channel */}
        <Box className="flex-row items-center gap-2 mb-1">
          <Text className="text-sm text-typography-500">
            {t('order.id')} #{order.id.slice(0, 8)}
          </Text>
          <Box className="ml-2 px-2 py-0.5 rounded-md border border-border bg-background">
            <Text className="text-xs font-medium text-foreground">{channelLabel}</Text>
          </Box>
        </Box>

        {/* Date */}
        <Text className="text-base font-semibold text-foreground mb-2">
          {formatDate(order.createdAt)}
        </Text>

        {/* Cashier */}
        <Text className="text-sm text-typography-600 mb-1">
          {t('order.cashier')}: {order.cashier.fullName}
        </Text>

        {/* Customer (if exists) */}
        {order.customer && (
          <Text className="text-sm text-typography-600 mb-2">
            {t('order.customer')}: {order.customer.user.fullName}
          </Text>
        )}

        {/* Amount Section */}
        <Box className="mt-3 pt-3 border-t border-outline-100">
          <Box className="flex-row justify-between items-center">
            <Text className="text-sm text-typography-500">
              {t('order.totalAmount')}:
            </Text>
            <Text className="text-xl font-bold text-foreground">
              {formatAmount(order.totalAmount)} {t('common.currency')}
            </Text>
          </Box>

          {order.paidAmount > 0 && order.paidAmount !== order.totalAmount && (
            <Box className="flex-row justify-between items-center mt-1">
              <Text className="text-sm text-typography-500">
                {t('order.paidAmount')}:
              </Text>
              <Text className="text-sm font-medium text-green-600">
                {formatAmount(order.paidAmount)} {t('common.currency')}
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
