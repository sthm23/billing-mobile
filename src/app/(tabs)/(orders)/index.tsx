import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useOrders } from '@/services/order/order.queries';
import { useMemo, useState } from 'react';
import {
  SafeAreaView
} from 'react-native-safe-area-context';

import { OrderParams, OrderStatus } from '@/services/order/order.type';
import { Picker } from '@expo/ui/community/picker';

type OrderStatusType = 'active' | 'completed';

const getStatus = (value: OrderStatusType): OrderStatus[] => {
  if (value === 'active') {
    return [OrderStatus.CREATED, OrderStatus.HOLD];
  } else {
    return [OrderStatus.COMPLETED];
  }
};

export default function OrdersScreen() {
  const page = 1
  const pageSize = 10
  const debouncedSearch = ''
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
      search: debouncedSearch || undefined,
      fromDate: undefined,
      toDate: undefined,
      status: getStatus(status),
    }),
    [
      page,
      pageSize,
      debouncedSearch,
      status,
    ]
  )

  const { data, isLoading, isError } = useOrders(listParams);

  if (isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text size="2xl" bold>Ошибка загрузки заказов</Text>
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text size="2xl" bold>Загрузка...</Text>
      </SafeAreaView>
    )
  }

  const orders = data?.data ?? []

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <Box className="flex-row items-center justify-between px-4 py-2">
        <Text size="2xl" bold>Заказы</Text>
        <Button>
          <ButtonText>Создать</ButtonText>
        </Button>
      </Box>

      <Box className="flex-1 w-full">

        <Picker
          selectedValue={status}
          onValueChange={(value) => {
            setStatus(value);
          }}
        >
          <Picker.Item label="Active" value="active" />
          <Picker.Item label="Completed" value="completed" />
        </Picker>
      </Box>
      <Box>
        {orders.length > 0 ? orders.map((order) => (
          <Box key={order.id} className="p-4 m-2 rounded-lg">
            <Text size="2xl" bold>Order ID: {order.id}</Text>
            <Text>Status: {order.status}</Text>
          </Box>
        )) : <Text>Нет заказов</Text>}
      </Box>
    </SafeAreaView>
  );
}

