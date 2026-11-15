import { IconButton, ListCard, Pressable, Spinner, Text } from '@/components/base';
import { Sheet, SheetFlatList } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { ORDER_STATUS_TONE } from '@/screens/order/order-status';
import { useOrders } from '@/services/order/order.queries';
import { OrderStatus, type Order } from '@/services/order/order.type';
import { ChevronRight, Plus, X } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface AddToOrderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Only orders of the product's warehouse can take it */
  warehouseId: string;
  /** «Name · 2 шт» under the title */
  subtitle: string;
  /** Order being saved: its row shows a spinner, the list is locked */
  pendingOrderId?: string | null;
  onSelectOrder: (order: Order) => void;
  onNewOrder: () => void;
}

const OPEN_STATUSES = [OrderStatus.CREATED, OrderStatus.HOLD];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/**
 * «В заказ»: a new order or one of the open (CREATED/HOLD) orders of the
 * product's warehouse.
 */
export function AddToOrderSheet({
  isOpen,
  onClose,
  warehouseId,
  subtitle,
  pendingOrderId,
  onSelectOrder,
  onNewOrder,
}: AddToOrderSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const { data, isLoading, isError } = useOrders({ status: OPEN_STATUSES, pageSize: 30 });
  const busy = Boolean(pendingOrderId);

  // The list has no warehouse filter; other warehouses' orders cannot take this product.
  // `GET /orders` returns the warehouse object only (no `warehouseId` field).
  const orders = useMemo(
    () => (data?.data ?? []).filter((o) => o.warehouse?.id === warehouseId),
    [data, warehouseId]
  );

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="half">
      <View className="flex-row items-center justify-between gap-3 px-4 pt-2 pb-3">
        <View className="flex-1 min-w-0 gap-0.5">
          <Text className="type-title text-ink" accessibilityRole="header">{t('product.addToOrder.title')}</Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>{subtitle}</Text>
        </View>
        <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
      </View>

      <SheetFlatList
        className="flex-1"
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerClassName="px-4 pb-6 gap-2"
        ListHeaderComponent={
          <View className="gap-2 pb-1">
            <Pressable
              onPress={onNewOrder}
              disabled={busy}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-[20px] bg-accent px-3.5 py-3"
            >
              <View className="w-11 h-11 rounded-full bg-card items-center justify-center">
                <Plus size={20} color={colors.ink} strokeWidth={2.2} />
              </View>
              <Text className="flex-1 font-onest-semibold text-base text-on-accent">{t('product.addToOrder.newOrder')}</Text>
              <ChevronRight size={20} color={colors.onAccent} strokeWidth={2} />
            </Pressable>
            {orders.length > 0 && (
              <Text className="type-label text-muted px-1 pt-2">{t('product.addToOrder.openOrders')}</Text>
            )}
          </View>
        }
        renderItem={({ item: order }) => (
          <ListCard
            lead={order.customer?.user.fullName ? initialsOf(order.customer.user.fullName) : '#'}
            title={order.customer?.user.fullName ?? t('product.addToOrder.noCustomer')}
            subtitle={`${order.cashier.user.fullName} · ${formatTime(order.createdAt)}`}
            amount={order.totalAmount}
            badge={
              pendingOrderId === order.id
                ? undefined
                : { label: t(`order.status.${order.status}`), tone: ORDER_STATUS_TONE[order.status] ?? 'neutral' }
            }
            leading={pendingOrderId === order.id ? <Spinner size="sm" className="w-11 h-11" /> : undefined}
            disabled={busy}
            onPress={() => onSelectOrder(order)}
            className="bg-sunken"
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <Spinner size="sm" className="py-6" />
          ) : (
            <Text className="font-onest text-[13px] text-muted text-center py-6 px-6">
              {isError ? t('product.addToOrder.loadFailed') : t('product.addToOrder.noOpenOrders')}
            </Text>
          )
        }
      />
    </Sheet>
  );
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
