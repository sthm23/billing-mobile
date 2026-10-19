import { Button, IconButton, Segmented, Text } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useBottomNavInset } from '@/components/navigation/BottomNav';
import { useOrders } from '@/services/order/order.queries';
import { OrderParams, OrderStatus } from '@/services/order/order.type';
import { router } from 'expo-router';
import { CircleAlert, Plus, ReceiptText, SlidersHorizontal } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { OrderCard } from './OrderCard';


type OrderStatusType = 'active' | 'completed';

const getStatus = (value: OrderStatusType): OrderStatus[] => {
    if (value === 'active') {
        return [OrderStatus.CREATED, OrderStatus.HOLD];
    } else {
        return [OrderStatus.COMPLETED];
    }
};
export default function OrderPage() {
    const { t } = useTranslation();
    const bottomInset = useBottomNavInset();
    const page = 1
    const pageSize = 10
    const [searchText] = useState('');
    const [status, setStatus] = useState<OrderStatusType>('active');

    const tabOptions: {
        value: OrderStatusType;
        label: string;
    }[] = [
            { value: 'active', label: t('order.activeTab') },
            { value: 'completed', label: t('order.completedTab') },
        ];

    const listParams = useMemo<OrderParams>(
        () => ({
            currentPage: page,
            pageSize,
            search: searchText || undefined,
            fromDate: undefined,
            toDate: undefined,
            status: getStatus(status),
        }),
        [
            page,
            pageSize,
            searchText,
            status,
        ]
    )

    const { data, isLoading, isError } = useOrders(listParams);

    const orders = data?.data ?? []

    const handleOrderPress = (orderId: string) => {
        router.push(`/(tabs)/(orders)/${orderId}`);
    };

    return (
        <View className="flex-1 bg-bg">
            <View className="px-4 pt-2 pb-3 gap-3">
                <View className="flex-row items-center justify-between">
                    <Text className="type-title text-ink" accessibilityRole="header">{t('navigation.orders')}</Text>
                    {/* Order creation arrives with the new order flow (redesign stage 5) */}
                    <Button variant="primary" icon={Plus} disabled>
                        {t('order.create')}
                    </Button>
                </View>
                <View className="flex-row items-center gap-2">
                    <Segmented options={tabOptions} value={status} onChange={setStatus} className="flex-1" />
                    {/* Filters are not available yet */}
                    <IconButton icon={SlidersHorizontal} accessibilityLabel={t('common.filter')} disabled />
                </View>
            </View>

            {isError ? (
                <EmptyState icon={CircleAlert} message={t('order.errorLoading')} />
            ) : isLoading ? (
                <LoadingState />
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <OrderCard
                            order={item}
                            onPress={handleOrderPress}
                            t={t}
                        />
                    )}
                    ListEmptyComponent={<EmptyState icon={ReceiptText} message={t('order.noOrders')} />}
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: bottomInset, gap: 8 }}
                />
            )}
        </View>
    )
}
