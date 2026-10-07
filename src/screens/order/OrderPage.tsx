import { Box, Button, HStack, Pressable, Spinner, Text } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { useOrders } from '@/services/order/order.queries';
import { OrderParams, OrderStatus } from '@/services/order/order.type';
import { router } from 'expo-router';
import { Filter, Plus, ShoppingBag } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
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
    const colors = useTheme();
    const page = 1
    const pageSize = 10
    const [searchText, setSearchText] = useState('');
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

    if (isError) {
        return (
            <Box className="flex-1 items-center justify-center p-4">
                <Text variant="large" className="text-error">
                    {t('order.errorLoading')}
                </Text>
            </Box>
        )
    }

    if (isLoading) {
        return (
            <Box className="flex-1 items-center justify-center">
                <Spinner size="lg" />
            </Box>
        )
    }

    const orders = data?.data ?? []

    const handleDeleteOrder = (orderId: string) => {
        console.log('Delete order:', orderId);
        // TODO: Implement API integration
    };

    const handleOrderPress = (orderId: string) => {
        router.push(`/(tabs)/(orders)/${orderId}`);
    };

    return (
        <>
            <Box className="w-full p-2">
                <HStack className="items-center justify-between mb-3">
                    <HStack className="items-center gap-2">
                        <ShoppingBag size={28} color={colors.foreground} />
                        <Text className="text-2xl font-bold">
                            {t('order.orderTitle')}
                        </Text>
                    </HStack>
                    <Button
                        size="sm"
                    >
                        <Plus size={20} color={colors.secondary} />
                        <Text className='text-white dark:text-black'>{t('order.create')}</Text>
                    </Button>
                </HStack>
                <HStack gap={4} className="justify-between items-center">
                    {/* Custom Tab Switcher */}
                    <HStack className="flex-1 rounded-lg border border-border bg-muted overflow-hidden">
                        {tabOptions.map((tab, index) => {
                            const isActive = status === tab.value;
                            const isFirst = index === 0;
                            const isLast = index === tabOptions.length - 1;

                            return (
                                <Pressable
                                    key={tab.value}
                                    onPress={() => setStatus(tab.value)}
                                    className="flex-1 py-2 px-3 items-center justify-center"
                                    style={{
                                        backgroundColor: isActive ? colors.background : 'transparent',
                                        borderRightWidth: isLast ? 0 : 1,
                                        borderRightColor: colors.border,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: isActive ? colors.primary : colors.mutedForeground,
                                            fontWeight: isActive ? '600' : '400',
                                            fontSize: 14,
                                        }}
                                    >
                                        {tab.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </HStack>

                    {/* Unlock Button */}
                    <Button
                        variant="outline"
                        size="md"
                    >
                        <Filter size={20} color={colors.textMuted} />
                    </Button>
                </HStack>
            </Box>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                style={{
                    padding: 6
                }}
                renderItem={({ item }) => (
                    <OrderCard
                        order={item}
                        onPress={handleOrderPress}
                        t={t}
                    />
                )}
                ListEmptyComponent={() => (
                    <Box className="flex-1 items-center justify-center p-8">
                        <Text variant="muted">{t('order.noOrders')}</Text>
                    </Box>
                )}
                contentContainerStyle={{ flexGrow: 1 }}
            />
        </>
    )
}