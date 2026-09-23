import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { OrderPayment, PaymentType } from '@/services/order/order.type';

interface OrderPaymentCardProps {
  payment: OrderPayment;
}

const getPaymentTypeText = (type: PaymentType) => {
  switch (type) {
    case PaymentType.CASH:
      return 'Наличные';
    case PaymentType.CARD:
      return 'Карта';
    case PaymentType.ONLINE:
      return 'Онлайн';
    case PaymentType.TRANSFER:
      return 'Перевод';
    default:
      return type;
  }
};

const getPaymentTypeIcon = (type: PaymentType) => {
  switch (type) {
    case PaymentType.CASH:
      return '💵';
    case PaymentType.CARD:
      return '💳';
    case PaymentType.ONLINE:
      return '🌐';
    case PaymentType.TRANSFER:
      return '🔄';
    default:
      return '💰';
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

export function OrderPaymentCard({ payment }: OrderPaymentCardProps) {
  return (
    <HStack className="justify-between items-center py-2">
      <HStack className="items-center gap-3 flex-1">
        <Box className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-full items-center justify-center">
          <Text className="text-xl">{getPaymentTypeIcon(payment.type)}</Text>
        </Box>
        <VStack className="flex-1">
          <Text className="text-sm font-medium text-foreground">
            {getPaymentTypeText(payment.type)}
          </Text>
          <Text className="text-xs text-typography-500 mt-0.5">
            {formatDate(payment.createdAt)}
          </Text>
        </VStack>
      </HStack>
      <Text className="text-base font-bold text-green-600">
        +{formatAmount(payment.amount)} UZS
      </Text>
    </HStack>
  );
}
