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
    const page = 1
    const pageSize = 10
    const [searchText, setSearchText] = useState('');
    const [status, setStatus] = useState<OrderStatusType>('active');

    const tabOptions: {
        value: OrderStatusType;
        label: string;
    }[] = [
            { value: 'active', label: t('Active') },
            { value: 'completed', label: t('Completed') },
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

    const handleDeleteOrder = (orderId: string) => {
        console.log('Delete order:', orderId);
        // TODO: Implement API integration
    };

    const handleOrderPress = (orderId: string) => {
        router.push(`/(tabs)/(orders)/${orderId}`);
    };

    return (
        <>
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
                ListEmptyComponent={() => (
                    <Box className="flex items-center justify-center p-8">
                        <Text className="text-typography-400 text-base">Нет заказов</Text>
                    </Box>
                )}
                contentContainerStyle={{ flexGrow: 1 }}
            />
        </>
    )
}