import { ListCard } from '@/components/base';
import { CashboxStatus, Payment } from '@/models/payment.model';
import { TFunction } from 'i18next';

type CashboxCardProps = {
  cashbox: Payment;
  onPress: (cashbox: Payment) => void;
  t: TFunction;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Cashbox row: cashier, warehouse and date, balance and status.
 * Open cashboxes are highlighted with the accent ring.
 */
export const CashboxCard = ({ cashbox, onPress, t }: CashboxCardProps) => {
  const isOpen = cashbox.status === CashboxStatus.OPEN;
  const formattedDate = new Date(cashbox.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const cashierName = cashbox.seller.user.fullName;

  return (
    <ListCard
      lead={getInitials(cashierName)}
      title={cashierName}
      subtitle={`${cashbox.warehouse.name} · ${formattedDate}`}
      amount={cashbox.balance}
      badge={{
        label: t(`payment.cashboxStatus.${cashbox.status}`),
        tone: isOpen ? 'accent' : 'neutral',
      }}
      highlight={isOpen}
      onPress={() => onPress(cashbox)}
    />
  );
};
