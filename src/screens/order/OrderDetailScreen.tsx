import { Button, IconButton, Money, Pressable, Text } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { ProductSearchSheet, type ProductSearchSheetRef } from '@/components/order/ProductSearchSheet';
import { SwipeableOrderItemCard } from '@/components/order/SwipeableOrderItemCard';
import { useTheme } from '@/hooks/use-theme';
import { useOrderById } from '@/services/order/order.queries';
import { OrderProductVariant } from '@/services/order/order.type';
import { router } from 'expo-router';
import { ChevronLeft, CircleAlert, Plus, ScanBarcode, ShoppingCart, UserRound } from 'lucide-react-native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OrderDetailScreenProps {
  orderId: string;
}

export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { data: order, isLoading, isError } = useOrderById(orderId);
  const searchSheetRef = useRef<ProductSearchSheetRef>(null);

  const handleProductSelect = (item: OrderProductVariant) => {
    console.log('Product selected:', item.sku);
    // TODO: add item to order
  };

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  if (isError || !order) {
    return (
      <EmptyState icon={CircleAlert} message={t('order.errorLoadingOrder')}>
        <Button variant="secondary" onPress={() => router.back()}>
          {t('order.back')}
        </Button>
      </EmptyState>
    );
  }

  const items = 'items' in order ? order.items ?? [] : [];

  // Pre-existing client-side totals; to be replaced by backend values.
  const subtotal = items.reduce(
    (sum, item) => sum + item.retailPrice * item.quantity,
    0
  );
  const totalDiscount = items.reduce(
    (sum, item) => sum + Math.round(item.retailPrice * (item.sale / 100)) * item.quantity,
    0
  );

  const openSearch = () => searchSheetRef.current?.open();

  return (
    <ProductSearchSheet
      ref={searchSheetRef}
      orderId={orderId}
      onSelect={handleProductSelect}
    >
      <View className="flex-1 bg-bg">
        {/* Header */}
        <View className="flex-row items-center gap-2 px-4 pt-2 pb-3">
          <IconButton icon={ChevronLeft} accessibilityLabel={t('order.back')} onPress={() => router.back()} />
          <View className="flex-1 min-w-0">
            <Text className="type-heading text-ink" accessibilityRole="header">{t('order.orderTitle')}</Text>
            <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
              {order.warehouse.name} · {t('order.itemsCount', { count: items.length })}
            </Text>
          </View>
          {/* Customer selection arrives with the new order flow (redesign stage 5) */}
          <IconButton icon={UserRound} accessibilityLabel={t('order.customer')} disabled />
        </View>

        {/* Add product */}
        <View className="px-4 pb-3">
          <Pressable
            onPress={openSearch}
            className="flex-row items-center gap-2.5 h-12 rounded-pill bg-card pl-4 pr-1.5"
            accessibilityRole="button"
            accessibilityLabel={t('order.addProduct')}
          >
            <Plus size={20} color={colors.ink} strokeWidth={2} />
            <Text className="flex-1 font-onest-medium text-[15px] text-ink">{t('order.addProduct')}</Text>
            <View className="flex-row items-center gap-1.5 h-9 px-3.5 rounded-pill bg-accent">
              <ScanBarcode size={16} color={colors.onAccent} strokeWidth={2.2} />
              <Text className="font-onest-bold text-[13px] text-on-accent">{t('order.scan')}</Text>
            </View>
          </Pressable>
        </View>

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
          ListEmptyComponent={<EmptyState icon={ShoppingCart} message={t('order.noItems')} />}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}
        />

        {/* Totals */}
        <View className="bg-hero rounded-t-4xl px-5 pt-5 gap-2" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="flex-row items-center justify-between">
            <Text className="font-onest text-sm text-hero-muted">{t('order.subtotal')}</Text>
            <Money value={subtotal} className="font-onest-medium text-sm text-hero-ink" currencyClassName="text-hero-muted" />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="font-onest text-sm text-hero-muted">{t('order.discount')}</Text>
            <Money
              value={-totalDiscount}
              className="font-onest-semibold text-sm text-hero-err"
              currencyClassName="text-hero-muted"
            />
          </View>
          <View className="flex-row items-center justify-between pt-1">
            <Text className="font-onest-semibold text-base text-hero-ink">{t('order.total')}</Text>
            <Money
              value={order.totalAmount}
              className="text-[22px] tracking-[-0.4px] text-hero-ink"
              currencyClassName="text-[13px] text-hero-muted"
            />
          </View>

          <View className="flex-row gap-2.5 pt-3">
            <Button variant="hero" size="lg" className="flex-1" onPress={() => {}}>
              {t('order.hold')}
            </Button>
            <Button variant="accent" size="lg" className="flex-1" onPress={() => {}}>
              {t('order.placeOrder')}
            </Button>
          </View>
        </View>
      </View>
    </ProductSearchSheet>
  );
}
