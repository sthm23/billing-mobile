import { Button, Chip, IconButton, Money, Pressable, Text } from '@/components/base';
import { CustomerPickerSheet, PriceSheet, SwipeableOrderItemCard } from '@/components/order';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { canLowerPrice } from '@/libs/roles';
import { useAuth } from '@/provider/AuthProvider';
import { useSaveOrder } from '@/services/order/order.queries';
import { OrderChannel, type OrderDetail } from '@/services/order/order.type';
import { router } from 'expo-router';
import { ChevronLeft, CircleAlert, ScanBarcode, Search, ShoppingCart, UserRound, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cartStore, cartToPayload, cartTotals, linePrice, useCart } from './cart-store';
import { useStaffWarehouses } from './use-staff-warehouses';

interface OrderCartScreenProps {
  /** Saved CREATED/HOLD order to edit; omitted for a new order */
  order?: OrderDetail;
  /** Open the scanner right away (BottomNav scan button) */
  startScan?: boolean;
  /** Keep the new-order cart already filled elsewhere (product card «В заказ») */
  keepCart?: boolean;
}

/**
 * Order cart (design «Order»): lines with swipe-to-delete, price sheet,
 * customer, totals preview, «Бронь» (save as HOLD) and «Оплатить».
 * The order is created on the backend on the first save.
 */
export function OrderCartScreen({ order, startScan, keepCart }: OrderCartScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const cart = useCart();
  const warehouses = useStaffWarehouses();
  const saveOrder = useSaveOrder();
  const [priceKey, setPriceKey] = useState<string | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canLower = canLowerPrice(user);

  // Fresh cart per screen: the saved order, or an empty one.
  useEffect(() => {
    if (order) {
      cartStore.loadOrder(order);
    } else if (keepCart && !cartStore.get().orderId) {
      // Already filled (product card) — keep it.
    } else {
      cartStore.startNew(warehouses.length === 1 ? warehouses[0].id : undefined);
      // With several warehouses the seller picks one first.
      if (startScan && warehouses.length === 1) router.push('/(tabs)/(orders)/scan');
    }
    // Only on mount — later refetches must not drop unsaved edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = cartTotals(cart);
  const isEmpty = cart.lines.length === 0;
  const warehouseName = warehouses.find((w) => w.id === cart.warehouseId)?.name ?? order?.warehouse?.name;
  const canPickWarehouse = !cart.orderId && warehouses.length > 1;
  const priceLine = cart.lines.find((l) => l.key === priceKey) ?? null;

  const openSearch = () => {
    if (!cart.warehouseId) {
      setError(t('sale.cart.chooseWarehouse'));
      return;
    }
    router.push('/(tabs)/(orders)/search');
  };

  const openScanner = () => {
    if (!cart.warehouseId) {
      setError(t('sale.cart.chooseWarehouse'));
      return;
    }
    router.push('/(tabs)/(orders)/scan');
  };

  const save = (next: 'hold' | 'pay') => {
    const storeId = user?.staff?.storeId;
    if (!cart.warehouseId || !storeId) {
      setError(t('sale.cart.chooseWarehouse'));
      return;
    }
    setError(null);
    saveOrder.mutate(
      {
        orderId: cart.orderId,
        create: {
          storeId,
          warehouseId: cart.warehouseId,
          channel: OrderChannel.POS,
          customerId: cart.customer?.id,
        },
        items: cartToPayload(cart),
        onCreated: (id) => cartStore.setOrderId(id),
      },
      {
        onSuccess: (id) => {
          if (next === 'pay') {
            router.push({ pathname: '/(tabs)/(orders)/pay/[id]', params: { id } });
          } else {
            Alert.alert(t('sale.cart.heldTitle'), t('sale.cart.heldText'));
            router.back();
          }
        },
        onError: (err) => setError(getApiErrorMessage(err, t('sale.cart.saveFailed'))),
      }
    );
  };

  return (
    <View className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('order.back')} onPress={() => router.back()} />
        <View className="flex-1 min-w-0">
          <Text className="type-heading text-ink" accessibilityRole="header">
            {order ? t('order.orderTitle') : t('sale.cart.newTitle')}
          </Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {[warehouseName, isEmpty ? t('sale.cart.noItemsShort') : t('order.itemsCount', { count: cart.lines.length })]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <Pressable
          onPress={() => setCustomerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('sale.customer.title')}
          className="flex-row items-center gap-1.5 h-11 max-w-[150px] px-3.5 rounded-pill bg-card"
        >
          <UserRound size={18} color={colors.ink} strokeWidth={2} />
          <Text className="font-onest-semibold text-sm text-ink" numberOfLines={1}>
            {cart.customer ? cart.customer.fullName : t('sale.customer.button')}
          </Text>
        </Pressable>
        {cart.customer && (
          <IconButton
            icon={X}
            size="sm"
            accessibilityLabel={t('sale.customer.clear')}
            onPress={() => cartStore.setCustomer(null)}
          />
        )}
      </View>

      {canPickWarehouse && (
        <View className="flex-row flex-wrap gap-2 px-4 pb-3">
          {warehouses.map((w) => (
            <Chip
              key={w.id}
              label={w.name}
              selected={w.id === cart.warehouseId}
              onPress={() => cartStore.setWarehouse(w.id)}
            />
          ))}
        </View>
      )}

      {/* Add product */}
      <View className="px-4 pb-3">
        <View className="flex-row items-center gap-2.5 h-12 rounded-pill bg-card pl-4 pr-1.5">
          <Pressable
            onPress={openSearch}
            className="flex-1 flex-row items-center gap-2.5 h-full"
            accessibilityRole="button"
            accessibilityLabel={t('order.addProduct')}
          >
            <Search size={20} color={colors.muted} strokeWidth={2} />
            <Text className="flex-1 font-onest text-[15px] text-muted">{t('order.addProduct')}</Text>
          </Pressable>
          <Pressable
            onPress={openScanner}
            accessibilityRole="button"
            accessibilityLabel={t('sale.scan.title')}
            className="flex-row items-center gap-1.5 h-9 px-3 rounded-pill bg-accent"
          >
            <ScanBarcode size={16} color={colors.onAccent} strokeWidth={2.2} />
            <Text className="font-onest-bold text-[13px] text-on-accent">{t('order.scan')}</Text>
          </Pressable>
        </View>
      </View>

      {error && (
        <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-2xl bg-err-bg px-3.5 py-3">
          <CircleAlert size={18} color={colors.errFg} strokeWidth={2} />
          <Text className="flex-1 font-onest text-[13px] text-err-fg">{error}</Text>
        </View>
      )}

      <FlatList
        data={cart.lines}
        keyExtractor={(line) => line.key}
        renderItem={({ item: line }) => (
          <SwipeableOrderItemCard
            name={line.name}
            variantLabel={line.variantLabel}
            price={linePrice(line)}
            basePrice={line.basePrice}
            quantity={line.quantity}
            stock={line.stock}
            onPress={() => setPriceKey(line.key)}
            onQuantityChange={(q) => cartStore.setQuantity(line.key, q)}
            onDelete={() => cartStore.remove(line.key)}
          />
        )}
        ListEmptyComponent={
          <View className="gap-3">
            <View className="bg-card rounded-3xl px-5 pt-7 pb-5 items-center gap-3">
              <View className="w-16 h-16 rounded-full bg-sunken items-center justify-center">
                <ShoppingCart size={28} color={colors.muted} strokeWidth={1.75} />
              </View>
              <Text className="font-onest-bold text-lg text-ink">{t('sale.cart.emptyTitle')}</Text>
              <Text className="font-onest text-[13px] leading-[19px] text-muted text-center max-w-[260px]">
                {t('sale.cart.emptyText')}
              </Text>
              <View className="flex-row gap-2 w-full pt-1.5">
                <Button variant="secondary" icon={Search} className="flex-1" onPress={openSearch}>
                  {t('sale.cart.find')}
                </Button>
                <Button variant="accent" icon={ScanBarcode} className="flex-1" onPress={openScanner}>
                  {t('sale.cart.scan')}
                </Button>
              </View>
            </View>
            <Text className="font-onest text-xs text-muted text-center">{t('sale.cart.customerHint')}</Text>
          </View>
        }
        ListFooterComponent={
          isEmpty ? null : (
            <Text className="font-onest text-xs text-muted text-center pt-0.5">{t('sale.cart.linesHint')}</Text>
          )
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}
      />

      {/* Totals (preview; the backend recalculates on save) */}
      <View className="bg-hero rounded-t-4xl px-5 pt-[22px] gap-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="flex-row items-center justify-between">
          <Text className="font-onest text-sm text-hero-muted">{t('order.subtotal')}</Text>
          <Money value={totals.sum} className="font-onest text-sm text-hero-muted" currencyClassName="text-hero-muted" />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="font-onest text-sm text-hero-muted">{t('order.discount')}</Text>
          <Money
            value={-totals.discount}
            className="font-onest-semibold text-sm text-hero-err"
            currencyClassName="text-hero-muted"
          />
        </View>
        <View className="h-px bg-hero-line" />
        <View className="flex-row items-baseline justify-between">
          <Text className="font-onest text-[15px] text-hero-muted">{t('order.total')}</Text>
          <Money
            value={totals.total}
            className="text-[30px] tracking-[-0.6px] text-hero-ink"
            currencyClassName="text-sm text-hero-muted"
          />
        </View>
        <View className="flex-row gap-2.5 pt-1">
          <Button
            variant="hero"
            size="lg"
            className="flex-1"
            onPress={() => save('hold')}
            disabled={isEmpty || saveOrder.isPending}
          >
            {t('sale.cart.hold')}
          </Button>
          <Button
            variant="accent"
            size="lg"
            className="flex-2"
            onPress={() => save('pay')}
            disabled={isEmpty || saveOrder.isPending}
            loading={saveOrder.isPending}
          >
            {t('sale.cart.pay')}
          </Button>
        </View>
      </View>

      <PriceSheet
        line={priceLine}
        canLower={canLower}
        onClose={() => setPriceKey(null)}
        onApply={(key, result) => {
          cartStore.setPrice(key, { retailPrice: result.retailPrice, sale: result.sale });
          cartStore.setQuantity(key, result.quantity);
          setPriceKey(null);
        }}
      />

      <CustomerPickerSheet
        isOpen={customerOpen}
        selectedId={cart.customer?.id}
        onClose={() => setCustomerOpen(false)}
        onSelect={(customer) => {
          cartStore.setCustomer(customer);
          setCustomerOpen(false);
        }}
      />
    </View>
  );
}
