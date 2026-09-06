import { SearchableHeader } from '@/components/SearchableHeader';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon } from '@/components/ui/button';
import { UnlockIcon } from '@/components/ui/icon';
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
import { OrderCardMenu } from './OrderCardMenu';


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

            <Box className="w-full flex-row justify-between p-2 gap-4">
                <Tabs className="w-fit" defaultValue={status} variant="filled" onValueChange={(value: OrderStatusType) => setStatus(value)}>
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
                <Button variant='ghost' size="lg" className="rounded-full p-3.5">
                    <ButtonIcon as={UnlockIcon} />
                </Button>
            </Box>
            <Box>
                {orders.length > 0 ? orders.map((order) => (
                    <Box key={order.id} className="relative p-4 m-2 border border-gray-300 rounded-xl bg-card flex-row justify-between items-center gap-4">
                        <Box className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 rounded-tr-xl rounded-bl-xl">
                            <Text>{order.status}</Text>
                        </Box>
                        <Box>
                            <Text bold>{order.createdAt}</Text>
                            <Text>{order.cashier.fullName}</Text>
                            <Text>{order.totalAmount}</Text>
                        </Box>
                        <Box>
                            <OrderCardMenu />
                        </Box>
                    </Box>
                )) : <Text>Нет заказов</Text>}
            </Box>
        </>
    )
}