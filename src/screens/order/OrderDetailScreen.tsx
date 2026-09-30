import { ProductSearchSheet, type ProductSearchSheetRef } from '@/components/order/ProductSearchSheet';
import { SwipeableOrderItemCard } from '@/components/order/SwipeableOrderItemCard';
import { Box, Button, HStack, Text, VStack } from '@/components/base';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ExternalLink,
  Search,
  Trash2,
} from 'lucide-react-native';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
import { useOrderById } from '@/services/order/order.queries';
import { OrderProductVariant } from '@/services/order/order.type';
import { router } from 'expo-router';
import { useRef } from 'react';
import { FlatList } from 'react-native';

interface OrderDetailScreenProps {
  orderId: string;
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const { data: order, isLoading, isError } = useOrderById(orderId);
  const searchSheetRef = useRef<ProductSearchSheetRef>(null);

  const handleProductSelect = (item: OrderProductVariant) => {
    console.log('Product selected:', item.sku);
    // TODO: add item to order
  };

  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center">
        <Text className="text-base text-typography-500">Загрузка...</Text>
      </Box>
    );
  }

  if (isError || !order) {
    return (
      <Box className="flex-1 items-center justify-center p-4">
        <VStack gap={4} className="items-center">
          <Text className="text-base text-destructive">Ошибка загрузки заказа</Text>
          <Button onPress={() => router.back()} variant="outline">
            Назад
          </Button>
        </VStack>
      </Box>
    );
  }

  const items = 'items' in order ? order.items ?? [] : [];

  const subtotal = items.reduce(
    (sum, item) => sum + item.retailPrice * item.quantity,
    0
  );
  const totalDiscount = items.reduce(
    (sum, item) => sum + Math.round(item.retailPrice * (item.sale / 100)) * item.quantity,
    0
  );

  return (
    <ProductSearchSheet
      ref={searchSheetRef}
      orderId={orderId}
      onSelect={handleProductSelect}
    >
      <Box className="flex-1 bg-background">
        {/* Header */}
        <HStack className="px-2 py-2 items-center border-b border-border bg-background" gap={1}>
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <Text className="text-lg font-semibold text-foreground">Заказ</Text>
        </HStack>

        {/* Search + Scan + Customer */}
        <HStack className="px-3 py-2 items-center bg-background border-b border-border" gap={2}>
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-xl justify-start px-3"
            onPress={() => searchSheetRef.current?.open()}
          >
            <Search size={18} className="text-muted-foreground" />
            <Text className="text-muted-foreground font-normal">Поиск</Text>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-10 px-3 rounded-xl bg-foreground"
            onPress={() => searchSheetRef.current?.open()}
          >
            <CustomIcon name={IconNames.BARCODE_SCANNER} size={18} color="#fff" />
            <Text className="text-background text-sm font-medium">Scan</Text>
          </Button>
          <Button variant="outline" size="sm" className="h-10 w-10 rounded-xl">
            <CustomIcon name={IconNames.PERSON} size={20} />
          </Button>
        </HStack>

        {/* Items list */}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <SwipeableOrderItemCard
              item={item}
              index={index}
              onDelete={() => {}}
              onQuantityChange={() => {}}
            />
          )}
          ListEmptyComponent={() => (
            <Box className="flex-1 items-center justify-center p-12">
              <Text className="text-typography-400 text-base">Нет товаров</Text>
            </Box>
          )}
          contentContainerStyle={{ flexGrow: 1 }}
        />

        {/* Sticky bottom panel */}
        <Box className="bg-background border-t border-border px-4 pt-3 pb-4">
          <VStack gap={2}>
            <HStack className="justify-between items-center">
              <Text className="text-sm text-typography-500">Общая сумма:</Text>
              <Text className="text-sm font-medium text-foreground">
                {formatAmount(subtotal)} UZS
              </Text>
            </HStack>

            <HStack className="justify-between items-center">
              <Text className="text-sm text-typography-500">Скидка:</Text>
              <HStack className="items-center" gap={2}>
                <Text className="text-sm font-semibold text-destructive">
                  -{formatAmount(totalDiscount)} UZS
                </Text>
                <Button variant="outline" size="sm" className="h-7 w-7 rounded-lg">
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </HStack>
            </HStack>

            <HStack className="justify-between items-center">
              <Text className="text-sm font-semibold text-foreground">Итого:</Text>
              <HStack className="items-center" gap={2}>
                <Text className="text-base font-bold text-foreground">
                  {formatAmount(order.totalAmount)} UZS
                </Text>
                <Button variant="outline" size="sm" className="h-7 w-7 rounded-lg">
                  <ExternalLink size={16} />
                </Button>
              </HStack>
            </HStack>
          </VStack>

          {/* Action buttons */}
          <HStack className="mt-3" gap={3}>
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl"
              onPress={() => {}}
            >
              <Clock size={20} />
              <Text className="text-foreground font-medium">Бронь</Text>
            </Button>
            <Button
              variant="default"
              className="flex-1 h-12 rounded-xl"
              onPress={() => {}}
            >
              <CheckCircle size={20} />
              <Text className="text-primary-foreground font-semibold">Заказать</Text>
            </Button>
          </HStack>
        </Box>
      </Box>
    </ProductSearchSheet>
  );
}
