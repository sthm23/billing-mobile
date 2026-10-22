import { ListCard } from '@/components/base';
import { Order } from '@/services/order/order.type';
import { TFunction } from 'i18next';
import { ORDER_STATUS_TONE } from './order-status';

type OrderCardProps = {
    order: Order;
    onPress: (orderId: string) => void;
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
 * Order row: cashier, warehouse and time, total and status.
 */
export const OrderCard = ({ order, onPress, t }: OrderCardProps) => {
    const cashierName = order.cashier.user.fullName;
    const createdAt = new Date(order.createdAt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <ListCard
            lead={getInitials(cashierName)}
            title={cashierName}
            subtitle={`${order.warehouse.name} · ${createdAt}`}
            amount={order.totalAmount}
            badge={{ label: t(`order.status.${order.status}`), tone: ORDER_STATUS_TONE[order.status] ?? 'neutral' }}
            onPress={() => onPress(order.id)}
        />
    );
};
