import { SearchableHeader } from '@/components/SearchableHeader';
import { Box } from '@/components/ui/box';
import {
    Tabs,
    TabsIndicator,
    TabsList,
    TabsTrigger,
    TabsTriggerText
} from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { useOrders } from '@/services/order/order.queries';
import { OrderParams, OrderStatus } from '@/services/order/order.type';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';

type OrderStatusType = 'active' | 'completed';

const getStatus = (value: OrderStatusType): OrderStatus[] => {
    if (value === 'active') {
        return [OrderStatus.CREATED, OrderStatus.HOLD];
    } else {
        return [OrderStatus.COMPLETED];
    }
};
export default function OrderPage() {
    const page = 1
    const pageSize = 10
    const [searchText, setSearchText] = useState('');
    const [status, setStatus] = useState<OrderStatusType>('active');

    const tabOptions: {
        value: OrderStatusType;
        label: string;
    }[] = [
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
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
            <Text size="2xl" bold>Ошибка загрузки заказов</Text>
        )
    }

    if (isLoading) {
        return (
            <Text size="2xl" bold>Загрузка...</Text>
        )
    }

    const orders = data?.data ?? []

    return (
        <>
            <SearchableHeader
                title="Заказы"
                onSearchChange={setSearchText}
                actionLabel="Создать"
                onAction={() => router.push('/(tabs)/(orders)/create')}
            />

            <Box className="w-full p-2 gap-4">
                <Tabs defaultValue={status} variant="filled" onValueChange={(value: OrderStatusType) => setStatus(value)}>
                    <TabsList>
                        {tabOptions.map((option) => {
                            return (
                                <TabsTrigger value={option.value} key={option.value} >
                                    <TabsTriggerText>{option.label}</TabsTriggerText>
                                </TabsTrigger>
                            )
                        })}
                        <TabsIndicator />
                    </TabsList>
                </Tabs>
            </Box>
            <Box>
                {orders.length > 0 ? orders.map((order) => (
                    <Box key={order.id} className="p-4 m-2 border border-gray-300 rounded-xl">
                        <Text bold>Order ID: {order.id}</Text>
                        <Text>Status: {order.status}</Text>
                    </Box>
                )) : <Text>Нет заказов</Text>}
            </Box>
        </>
    )
}