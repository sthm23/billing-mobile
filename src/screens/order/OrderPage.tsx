import { Button, HeroCard, IconButton, Segmented, Text } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useBottomNavInset } from '@/components/navigation/BottomNav';
import { useOrders, useTodaySalesSummary } from '@/services/order/order.queries';
import { OrderParams, OrderStatus } from '@/services/order/order.type';
import { router } from 'expo-router';
import { CircleAlert, Plus, ReceiptText, SlidersHorizontal } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { OrderCard } from './OrderCard';
import { useRefreshControl } from '@/hooks/use-refresh-control';


type OrderStatusType = 'active' | 'completed';

const getStatus = (value: OrderStatusType): OrderStatus[] => {
    if (value === 'active') {
        return [OrderStatus.CREATED, OrderStatus.HOLD];
    } else {
        // Sold orders, including those left partly unpaid as debt
        return [OrderStatus.COMPLETED, OrderStatus.DEBT];
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

    const { data, isLoading, isError, refetch } = useOrders(listParams);
    const summary = useTodaySalesSummary();
    const refreshControl = useRefreshControl(() => Promise.all([refetch(), summary.refetch()]));

    const orders = data?.data ?? []

    const handleOrderPress = (orderId: string) => {
        router.push(`/(tabs)/(orders)/${orderId}`);
    };

    return (
        <View className="flex-1 bg-bg">
            <View className="px-4 pt-2 pb-3 gap-3">
                <View className="flex-row items-center justify-between">
                    <Text className="type-title text-ink" accessibilityRole="header">{t('navigation.orders')}</Text>
                    <Button variant="primary" icon={Plus} onPress={() => router.push('/(tabs)/(orders)/create')}>
                        {t('order.create')}
                    </Button>
                </View>
                {/* Hidden until loaded and on error — the list stays usable */}
                {summary.data && (
                    <HeroCard
                        label={t('order.summary.today')}
                        chip={t('order.summary.count', { count: summary.data.count })}
                        amount={summary.data.total}
                        currency={t('common.currency')}
                        tiles={[
                            { label: t('order.summary.paid'), value: summary.data.paid, tone: 'accent' },
                            { label: t('order.summary.debt'), value: summary.data.debt, tone: 'err' },
                        ]}
                    />
                )}
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
                    refreshControl={refreshControl}
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: bottomInset, gap: 8 }}
                />
            )}
        </View>
    )
}
