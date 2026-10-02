import { Box, Button, HStack, Pressable, Spinner, Text } from '@/components/base';
import { useOrders } from '@/services/order/order.queries';
import { OrderParams, OrderStatus } from '@/services/order/order.type';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import { Unlock } from 'lucide-react-native';
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
                <Spinner size="large" />
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
                <HStack gap={4} className="justify-between items-center">
                    {/* Custom Tab Switcher */}
                    <HStack gap={2} className="flex-1">
                        {tabOptions.map((option) => {
                            const isActive = status === option.value;
                            return (
                                <Pressable
                                    key={option.value}
                                    onPress={() => setStatus(option.value)}
                                    className={`
                                        px-4 py-2 rounded-lg
                                        ${isActive
                                            ? 'bg-primary'
                                            : 'bg-surface'
                                        }
                                    `}
                                >
                                    <Text
                                        variant={isActive ? 'default' : 'muted'}
                                        className={isActive ? 'text-white' : ''}
                                    >
                                        {option.label}
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </HStack>

                    {/* Unlock Button */}
                    <Button
                        variant="ghost"
                        size="lg"
                        className="rounded-full p-3"
                    >
                        <Unlock size={20} color={colors.textMuted} />
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