import { HStack, Pressable, Text, VStack } from '@/components/base';
import { StatusBadge } from '@/components/cashbox';
import { CashboxStatus, Payment } from '@/models/payment.model';
import { TFunction } from 'i18next';

type CashboxCardProps = {
  cashbox: Payment;
  onPress: (cashbox: Payment) => void;
  t: TFunction;
};

export const CashboxCard = ({ cashbox, onPress, t }: CashboxCardProps) => {
  const isOpen = cashbox.status === CashboxStatus.OPEN;
  const formattedDate = new Date(cashbox.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const cashierName = cashbox.seller.user.fullName;
  const warehouseName = cashbox.warehouse.name;
  const balance = Number(cashbox.balance);

  const statusLabel = isOpen
    ? t('payment.cashboxStatus.OPEN')
    : t('payment.cashboxStatus.CLOSED');

  return (
    <Pressable
      className="mb-2 rounded-xl border border-border bg-surface p-4"
      onPress={() => onPress(cashbox)}
    >
      <HStack className="items-start justify-between">
        {/* Left side - Info */}
        <VStack className="flex-1" gap={1}>
          {/* Cashier Name */}
          <Text size="lg" variant='bold' className="text-typography-900">
            {cashierName}
          </Text>

          {/* Warehouse */}
          <Text size="sm" className="text-typography-500">
            {warehouseName}
          </Text>

          {/* Date */}
          <Text size="sm" className="text-typography-500">
            {formattedDate}
          </Text>
        </VStack>

        {/* Right side - Status and Balance */}
        <VStack className="items-end" gap={2}>
          {/* Status Badge */}
          <StatusBadge
            label={statusLabel}
            variant={isOpen ? 'success' : 'default'}
          />

          {/* Balance */}
          <Text size="lg" variant='bold' className="text-typography-900">
            {balance.toLocaleString()} {t('common.currency')}
          </Text>
        </VStack>
      </HStack>
    </Pressable>
  );
};
