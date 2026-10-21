import { Button, IconButton, Money, StatusBadge, Text } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { OrderItemCard } from '@/components/order';
import { useTheme } from '@/hooks/use-theme';
import { useOrderById } from '@/services/order/order.queries';
import { OrderStatus } from '@/services/order/order.type';
import { router } from 'expo-router';
import { ChevronLeft, CircleAlert, ShoppingCart, UserRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrderCartScreen } from './cart/OrderCartScreen';
import { variantLabel } from './cart/cart-store';
import { ORDER_STATUS_TONE } from './order-status';
import { useRefreshControl } from '@/hooks/use-refresh-control';

interface OrderDetailScreenProps {
  orderId: string;
}

/**
 * Order screen: CREATED/HOLD orders open in the cart for editing and
 * payment; other statuses are read-only.
 */
export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { data: order, isLoading, isError, refetch } = useOrderById(orderId);
  const refreshControl = useRefreshControl(refetch);

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

  if (order.status === OrderStatus.CREATED || order.status === OrderStatus.HOLD) {
    return <OrderCartScreen order={order} />;
  }

  const items = order.items ?? [];
  // Display only — amounts come from the saved order.
  const subtotal = items.reduce((sum, item) => sum + Number(item.retailPrice) * item.quantity, 0);
  const discount = items.reduce((sum, item) => sum + Number(item.sale) * item.quantity, 0);
  const debt = Number(order.totalAmount) - Number(order.paidAmount);

  return (
    <View className="flex-1 bg-bg">
      <View className="flex-row items-center gap-2 px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('order.back')} onPress={() => router.back()} />
        <View className="flex-1 min-w-0">
          <Text className="type-heading text-ink" accessibilityRole="header">{t('order.orderTitle')}</Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {order.warehouse?.name ? `${order.warehouse.name} · ` : ''}
            {t('order.itemsCount', { count: items.length })}
          </Text>
        </View>
        <StatusBadge label={t(`order.status.${order.status}`)} tone={ORDER_STATUS_TONE[order.status]} />
      </View>

      {order.customer && (
        <View className="mx-4 mb-3 flex-row items-center gap-3 bg-card rounded-lg p-3">
          <View className="w-10 h-10 rounded-full bg-accent items-center justify-center">
            <UserRound size={18} color={colors.onAccent} strokeWidth={2} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="font-onest text-xs text-muted">{t('sale.customer.label')}</Text>
            <Text className="font-onest-semibold text-[15px] text-ink" numberOfLines={1}>{order.customer.user.fullName}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderItemCard
            name={item.variant.product?.name ?? item.variant.sku}
            variantLabel={variantLabel(
              (item.variant.attributes ?? []).map((a) => ({ value: a.value.valueString })),
              item.variant.sku
            )}
            price={Number(item.retailPrice) - Number(item.sale)}
            basePrice={Number(item.retailPrice)}
            quantity={item.quantity}
          />
        )}
        ListEmptyComponent={<EmptyState icon={ShoppingCart} message={t('order.noItems')} />}
        refreshControl={refreshControl}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}
      />

      <View className="bg-hero rounded-t-4xl px-5 pt-5 gap-2" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="flex-row items-center justify-between">
          <Text className="font-onest text-sm text-hero-muted">{t('order.subtotal')}</Text>
          <Money value={subtotal} className="font-onest-medium text-sm text-hero-ink" currencyClassName="text-hero-muted" />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="font-onest text-sm text-hero-muted">{t('order.discount')}</Text>
          <Money value={-discount} className="font-onest-semibold text-sm text-hero-err" currencyClassName="text-hero-muted" />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="font-onest text-sm text-hero-muted">{t('order.paidAmount')}</Text>
          <Money value={order.paidAmount} className="font-onest-medium text-sm text-hero-ink" currencyClassName="text-hero-muted" />
        </View>
        {order.status === OrderStatus.DEBT && debt > 0 && (
          <View className="flex-row items-center justify-between">
            <Text className="font-onest text-sm text-hero-muted">{t('order.debt')}</Text>
            <Money value={debt} className="font-onest-semibold text-sm text-hero-warn" currencyClassName="text-hero-muted" />
          </View>
        )}
        <View className="flex-row items-center justify-between pt-1">
          <Text className="font-onest-semibold text-base text-hero-ink">{t('order.total')}</Text>
          <Money value={order.totalAmount} className="text-[22px] tracking-[-0.4px] text-hero-ink" currencyClassName="text-[13px] text-hero-muted" />
        </View>
      </View>
    </View>
  );
}
