import { ListCard } from '@/components/base';
import { CashboxStatus, Payment } from '@/models/payment.model';
import { TFunction } from 'i18next';
import { formatDayMonth, formatTime, isSameDay } from '@/libs/date';

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

/** «с 09:00» (today) / «с 20.10, 09:00»; closed: «16.10, 09:00–19:30». */
function shiftText(cashbox: Payment, t: TFunction): string {
  const opened = new Date(cashbox.createdAt);
  const start = formatTime(cashbox.createdAt);
  if (cashbox.status === CashboxStatus.OPEN) {
    return t('payment.since', {
      time: isSameDay(opened, new Date()) ? start : `${formatDayMonth(cashbox.createdAt)}, ${start}`,
    });
  }
  const end = cashbox.closedAt ? `–${formatTime(cashbox.closedAt)}` : '';
  return `${formatDayMonth(cashbox.createdAt)}, ${start}${end}`;
}

/**
 * Cashbox row: cashier, warehouse and shift time, balance and status.
 * Open cashboxes are highlighted with the accent ring.
 */
export const CashboxCard = ({ cashbox, onPress, t }: CashboxCardProps) => {
  const isOpen = cashbox.status === CashboxStatus.OPEN;
  const cashierName = cashbox.seller.user.fullName;

  return (
    <ListCard
      lead={getInitials(cashierName)}
      title={cashierName}
      subtitle={`${cashbox.warehouse.name} · ${shiftText(cashbox, t)}`}
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
