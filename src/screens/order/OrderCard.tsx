import { StatusBadge } from '@/components/cashbox';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
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
            className="mb-2 rounded-xl border border-border bg-surface p-4"
            onPress={() => onPress(order.id)}
        >
            <HStack className="items-start justify-between">
                {/* Left side - Info */}
                <VStack className="flex-1 gap-1">
                    {/* Cashier Name */}
                    <Text size="lg" bold className="text-typography-900">
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
                <VStack className="items-end gap-2">
                    {/* Status Badge */}
                    <StatusBadge
                        label={statusLabel}
                        variant={isOpen ? 'success' : 'default'}
                    />

                    {/* total */}
                    <Text size="lg" bold className="text-typography-900">
                        {total.toLocaleString()} UZS
                    </Text>
                </VStack>
            </HStack>
        </Pressable>
    );
};
