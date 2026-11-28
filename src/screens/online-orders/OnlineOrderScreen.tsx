import { Button, IconButton, Pressable, StatusBadge, Text, toast } from '@/components/base';
import { ConfirmSheet, EmptyState, LoadingState } from '@/components/common';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { useWorkingWarehouse } from '@/hooks/use-working-warehouse';
import { formatMoney } from '@/libs/format';
import { canHandleOnlineOrders } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import { formatPhone } from '@/screens/profile/staff/staff-format';
import { useConfirmOnlineOrder, useOnlineOrder, type OnlineOrderDetails } from '@/services/telegram-shop';
import { router } from 'expo-router';
import { Check, ChevronLeft, CircleAlert, MessageSquareText, Phone, ShieldX, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  confirmErrorMessage,
  confirmFailure,
  formatDateTime,
  shortageText,
  statusBadge,
  telUrl,
} from './online-order-format';
import { RejectOnlineOrderSheet } from './RejectOnlineOrderSheet';

interface OnlineOrderScreenProps {
  id: string;
}

/**
 * Card of a request from the Telegram shop: who, what, at which prices, and for a new one
 * the warehouse to put the order on («хватает / не хватает»). «Подтвердить» makes the
 * customer and a sale order in «Бронь» — the discount and the payment are the usual order
 * screens. Everything shown (prices, stock, totals) comes from the backend.
 */
export function OnlineOrderScreen({ id }: OnlineOrderScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const allowed = canHandleOnlineOrders(user);
  const query = useOnlineOrder(allowed ? id : undefined);
  const refreshControl = useRefreshControl(query.refetch);
  const working = useWorkingWarehouse();
  const confirm = useConfirmOnlineOrder();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const order = query.data;

  // Default warehouse: the working one if it holds everything, else the first that does
  useEffect(() => {
    if (warehouseId || !order?.warehouses.length) return;
    const all = order.warehouses;
    const pick =
      all.find((w) => w.id === working.warehouseId && w.enough) ??
      all.find((w) => w.enough) ??
      all.find((w) => w.id === working.warehouseId) ??
      all[0];
    setWarehouseId(pick.id);
  }, [order, warehouseId, working.warehouseId]);

  const header = (
    <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <Text className="flex-1 type-heading text-ink" accessibilityRole="header">
        {order ? t('onlineOrders.cardTitle', { number: order.number }) : t('onlineOrders.title')}
      </Text>
      {order ? <StatusBadge {...statusBadge(order.status, t)} /> : null}
    </View>
  );

  if (!allowed) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={ShieldX} message={t('onlineOrders.noAccess')} />
      </View>
    );
  }
  if (query.isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <LoadingState />
      </View>
    );
  }
  if (!order) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={CircleAlert} message={t('onlineOrders.notFound')} />
      </View>
    );
  }

  const isNew = order.status === 'NEW';
  const selected = order.warehouses.find((w) => w.id === warehouseId);
  const gone = order.items.filter((item) => !item.available);
  const canConfirm = isNew && !!selected?.enough && gone.length === 0;
  const money = (value: string) => `${formatMoney(value)} ${t('common.currency')}`;
  const pricesChanged = Number(order.currentTotal) !== Number(order.total);

  const submitConfirm = () => {
    if (!warehouseId) return;
    setConfirmError(null);
    confirm.mutate(
      { id: order.id, warehouseId },
      {
        onSuccess: (result) => {
          setConfirmOpen(false);
          toast.show(result.customerNotified ? t('onlineOrders.confirmed') : t('onlineOrders.confirmedNotNotified'));
          router.push({ pathname: '/(tabs)/(orders)/[id]', params: { id: result.orderId } });
        },
        onError: (error) => {
          const message = confirmErrorMessage(error, t);
          if (confirmFailure(error) === 'already-handled') {
            setConfirmOpen(false);
            toast.show(message, 'error');
            return;
          }
          setConfirmError(message);
        },
      }
    );
  };

  return (
    <View className="flex-1 bg-bg">
      {header}
      <ScrollView
        className="flex-1"
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
      >
        <View className="bg-card rounded-2xl p-4 gap-3">
          <View className="flex-row items-start gap-3">
            <View className="flex-1 min-w-0 gap-0.5">
              <Text className="font-onest-bold text-lg leading-6 text-ink">{order.fullName}</Text>
              <Text className="font-onest-semibold text-[15px] text-ink">{formatPhone(order.phone)}</Text>
              <Text className="font-onest text-[13px] text-muted">
                {order.regionName}, {order.district}
              </Text>
              <Text className="font-onest text-xs text-muted">
                {t('onlineOrders.received', { date: formatDateTime(order.createdAt) })}
              </Text>
            </View>
            <IconButton
              icon={Phone}
              variant="primary"
              accessibilityLabel={t('onlineOrders.call')}
              onPress={() => void Linking.openURL(telUrl(order.phone))}
            />
          </View>

          {order.comment ? (
            <View className="bg-sunken rounded-xl px-3 py-2.5 gap-0.5">
              <View className="flex-row items-center gap-1.5">
                <MessageSquareText size={14} color={colors.soft} strokeWidth={2} />
                <Text className="font-onest text-xs text-muted">{t('onlineOrders.comment')}</Text>
              </View>
              <Text className="font-onest text-sm leading-5 text-ink">{order.comment}</Text>
            </View>
          ) : null}

          <View className="flex-row items-center gap-2 border-t border-line pt-3">
            <UserRound size={16} color={colors.soft} strokeWidth={2} />
            <Text className="flex-1 font-onest text-[13px] leading-[18px] text-soft">
              {order.customer
                ? t(isNew ? 'onlineOrders.customerExisting' : 'onlineOrders.customerLinked', {
                    name: order.customer.fullName,
                  })
                : t('onlineOrders.customerNew')}
            </Text>
          </View>
        </View>

        <View className="bg-card rounded-2xl px-4 py-2">
          <Text className="font-onest-bold text-[15px] text-ink pt-2 pb-1">{t('onlineOrders.itemsTitle')}</Text>
          {order.items.map((item, index) => (
            <View key={item.variantId} className={cn('py-3 gap-1', index > 0 && 'border-t border-line')}>
              <View className="flex-row items-start gap-2">
                <Text className="flex-1 min-w-0 font-onest-semibold text-[15px] text-ink">{item.label}</Text>
                {!item.available ? <StatusBadge label={t('onlineOrders.unavailable')} tone="err" size="sm" /> : null}
              </View>
              <Text className="font-onest text-[13px] text-muted tabular-nums">
                {item.quantity} × {money(item.priceAtRequest)}
              </Text>
              {Number(item.currentPrice) !== Number(item.priceAtRequest) ? (
                <Text className="font-onest-semibold text-xs text-warn-fg tabular-nums">
                  {t('onlineOrders.priceNow', { price: money(item.currentPrice) })}
                </Text>
              ) : null}
            </View>
          ))}
          <View className="border-t border-line py-3 gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="font-onest text-[13px] text-muted">{t('onlineOrders.totalRequest')}</Text>
              <Text className="font-onest-bold text-[15px] text-ink tabular-nums">{money(order.total)}</Text>
            </View>
            {pricesChanged ? (
              <View className="flex-row items-center justify-between">
                <Text className="font-onest text-[13px] text-muted">{t('onlineOrders.totalNow')}</Text>
                <Text className="font-onest-bold text-[15px] text-warn-fg tabular-nums">
                  {money(order.currentTotal)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {isNew ? (
          <>
            <WarehousePicker order={order} selectedId={warehouseId} onSelect={setWarehouseId} />

            {gone.length > 0 ? (
              <View className="bg-err-bg rounded-xl px-4 py-3" accessibilityRole="alert">
                <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">
                  {t('onlineOrders.unavailableItems', { items: gone.map((item) => item.label).join(', ') })}
                </Text>
              </View>
            ) : null}

            <View className="gap-2">
              <Button size="lg" full disabled={!canConfirm} onPress={() => setConfirmOpen(true)}>
                {t('onlineOrders.confirm')}
              </Button>
              <Button variant="danger" size="lg" full onPress={() => setRejectOpen(true)}>
                {t('onlineOrders.reject')}
              </Button>
            </View>
          </>
        ) : (
          <HandledBlock order={order} />
        )}
      </ScrollView>

      <ConfirmSheet
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('onlineOrders.confirmTitle', { number: order.number })}
        message={t('onlineOrders.confirmText', { warehouse: selected?.name ?? '' })}
        confirmLabel={t('onlineOrders.confirm')}
        loading={confirm.isPending}
        error={confirmError}
        onConfirm={submitConfirm}
      />
      <RejectOnlineOrderSheet
        id={order.id}
        number={order.number}
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onDone={() => router.back()}
      />
    </View>
  );
}

/** Which warehouse the order goes on; each shows whether it holds every product. */
function WarehousePicker({
  order,
  selectedId,
  onSelect,
}: {
  order: OnlineOrderDetails;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const colors = useTheme();
  const selected = order.warehouses.find((w) => w.id === selectedId);

  return (
    <View className="bg-card rounded-2xl p-4 gap-3">
      <Text className="font-onest-bold text-[15px] text-ink">{t('onlineOrders.warehouseTitle')}</Text>
      {order.warehouses.length === 0 ? (
        <Text className="font-onest text-sm text-muted">{t('onlineOrders.warehouseNone')}</Text>
      ) : (
        <View className="gap-2">
          {order.warehouses.map((warehouse) => {
            const isSelected = warehouse.id === selectedId;

            return (
              <Pressable
                key={warehouse.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(warehouse.id)}
                className={cn(
                  'flex-row items-center gap-3 rounded-xl px-3.5 py-3 border-2',
                  isSelected ? 'border-accent bg-card' : 'border-transparent bg-sunken'
                )}
              >
                <View
                  className={cn(
                    'w-5 h-5 rounded-full items-center justify-center',
                    isSelected ? 'bg-accent' : 'bg-track'
                  )}
                >
                  {isSelected ? <Check size={12} color={colors.onAccent} strokeWidth={3} /> : null}
                </View>
                <Text className="flex-1 min-w-0 font-onest-semibold text-[15px] text-ink" numberOfLines={1}>
                  {warehouse.name}
                </Text>
                <StatusBadge
                  label={warehouse.enough ? t('onlineOrders.warehouseEnough') : t('onlineOrders.warehouseShort')}
                  tone={warehouse.enough ? 'ok' : 'err'}
                  size="sm"
                />
              </Pressable>
            );
          })}
        </View>
      )}

      {selected && !selected.enough ? (
        <View className="bg-err-bg rounded-xl px-3.5 py-3 gap-1.5">
          {selected.shortages.map((line) => (
            <Text key={line.variantId} className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">
              {shortageText(line, t)}
            </Text>
          ))}
          <Text className="font-onest text-xs leading-4 text-err-fg">{t('onlineOrders.warehouseHint')}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** A handled request: the order it became, or why it was rejected. */
function HandledBlock({ order }: { order: OnlineOrderDetails }) {
  const { t } = useTranslation();
  const confirmed = order.status === 'CONFIRMED';
  const handled = [
    order.handledBy ? t('onlineOrders.handledBy', { name: order.handledBy }) : null,
    order.handledAt ? t('onlineOrders.handledAt', { date: formatDateTime(order.handledAt) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="bg-card rounded-2xl p-4 gap-3">
      <View className="gap-1">
        <Text className="font-onest-bold text-[15px] text-ink">
          {confirmed ? t('onlineOrders.orderCreated') : t('onlineOrders.statusREJECTED')}
        </Text>
        {handled ? <Text className="font-onest text-[13px] text-muted">{handled}</Text> : null}
        {!confirmed && order.rejectReason ? (
          <Text className="font-onest text-sm leading-5 text-ink">
            {t('onlineOrders.rejectedReason', { reason: order.rejectReason })}
          </Text>
        ) : null}
      </View>
      {confirmed && order.orderId ? (
        <Button
          size="lg"
          full
          onPress={() =>
            router.push({ pathname: '/(tabs)/(orders)/[id]', params: { id: order.orderId as string } })
          }
        >
          {t('onlineOrders.openOrder')}
        </Button>
      ) : null}
    </View>
  );
}
