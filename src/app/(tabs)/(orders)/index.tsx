import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
      <SafeAreaView className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <ThemedText type='title'>Ошибка загрузки заказов</ThemedText>
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <ThemedText type='title'>Загрузка...</ThemedText>
      </SafeAreaView>
    )
  }

  const orders = data?.data ?? []
  console.log(orders);



  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
      <ThemedView type='surface' className="flex-row items-center justify-between px-4 py-2">
        <ThemedText type='title'>Заказы</ThemedText>
        <Button>
          <ButtonText>Создать</ButtonText>
        </Button>
      </ThemedView>

      <ThemedView type='surface' className="flex-1 w-full">

        <Picker
          selectedValue={status}
          onValueChange={(value) => {
            setStatus(value);
          }}
        >
          <Picker.Item label="Active" value="active" />
          <Picker.Item label="Completed" value="completed" />
        </Picker>
      </ThemedView>
      <ThemedView>
        {orders.length > 0 ? orders.map((order) => (
          <ThemedView key={order.id} type='surface' className="p-4 m-2 rounded-lg">
            <ThemedText type='title'>Order ID: {order.id}</ThemedText>
            <ThemedText>Status: {order.status}</ThemedText>
          </ThemedView>
        )) : <ThemedText>Нет заказов</ThemedText>}
      </ThemedView>
    </SafeAreaView>
  );
}

