import { HStack, Pressable, Text, VStack } from '@/components/base';
import { StatusBadge } from '@/components/cashbox';
import { Order, OrderStatus } from '@/services/order/order.type';
import { TFunction } from 'i18next';

type OrderCardProps = {
    order: Order;
    onPress: (orderId: string) => void;
    t: TFunction;
};

export const OrderCard = ({ order, onPress, t }: OrderCardProps) => {
    const cashierName = order.cashier.user.fullName;
    const warehouseName = order.warehouse.name;
    const total = Number(order.totalAmount);

    const statusLabel = t(`order.status.${order.status}`);
    const isOpen = order.status === OrderStatus.CREATED;
    const formattedDate = new Date(order.createdAt).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    return (
        <Pressable
            className="mb-2 rounded-xl border border-border bg-card p-4 shadow-sm"
            onPress={() => onPress(order.id)}
        >
            <HStack className="items-start justify-between">
                {/* Left side - Info */}
                <VStack className="flex-1 gap-1">
                    {/* Cashier Name */}
                    <Text variant="large" className="font-bold text-foreground">
                        {cashierName}
                    </Text>

                    {/* Warehouse */}
                    <Text variant="muted">
                        {warehouseName}
                    </Text>

                    {/* Date */}
                    <Text variant="muted">
                        {formattedDate}
                    </Text>
                </VStack>

                {/* Right side - Status and Balance */}
                <VStack className="items-end gap-2">
                    {/* Status Badge */}
                    <StatusBadge
                        label={statusLabel}
                        variant={isOpen ? 'success' : 'default'}
                    />

                    {/* total */}
                    <Text variant="large" className="font-bold text-foreground">
                        {total.toLocaleString()} {t('common.currency')}
                    </Text>
                </VStack>
            </HStack>
        </Pressable>
    );
};
