import { ListCard } from '@/components/base';
import { Order } from '@/services/order/order.type';
import { TFunction } from 'i18next';
import { orderBadges, orderNo } from './order-status';

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
 * Order row: cashier, number, warehouse and time, total and the main badge
 * («Должны клиенту» first when the store owes the customer after a return).
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
            subtitle={`№${orderNo(order.id)} · ${order.warehouse.name} · ${createdAt}`}
            // After a return — the total that stays with the store (display only)
            amount={Number(order.totalAmount) - Number(order.returnedAmount ?? 0)}
            badge={orderBadges(order, t)[0]}
            onPress={() => onPress(order.id)}
        />
    );
};
