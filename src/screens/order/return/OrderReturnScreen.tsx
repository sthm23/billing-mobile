import { Button, IconButton, PhotoPlaceholder, Pressable, Segmented, Stepper, Text, toast } from '@/components/base';
import { CashboxPickerSheet } from '@/components/cashbox';
import { EmptyState, LoadingState } from '@/components/common';
import { PAYMENT_METHODS } from '@/components/order';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { canProcessReturns } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import { formatDay } from '@/screens/rental/rental-format';
import { useOpenCashboxes } from '@/services/cashbox';
import { useOrderById, useReturnOrder } from '@/services/order/order.queries';
import {
  OrderStatus,
  PaymentType,
  ReturnOrderStatus,
  ReturnReason,
  type OrderDetail,
  type ReturnOrderResult,
} from '@/services/order/order.type';
import { router } from 'expo-router';
import { ChevronLeft, CircleAlert, Info, Lock } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { variantLabel } from '../cart/cart-store';
import { orderNo } from '../order-status';

const REASONS: ReturnReason[] = [ReturnReason.DEFECT, ReturnReason.NOT_FIT, ReturnReason.EXTRA, ReturnReason.OTHER];
const COMMENT_MAX = 500;

type Payout = 'now' | 'later';

interface OrderReturnScreenProps {
  orderId: string;
}

/**
 * «Возврат товара» (design «OrderReturn» / «OrderReturnDebt» /
 * «OrderReturnEmpty»): units per line, reason + comment, and for money owed
 * to the customer — «Выдать сейчас» (one method) or «Выдать позже» (CREDIT).
 * The goods always go back to the order's warehouse. Sums here are a preview
 * from the order lines; the backend prices the return, decides how much of it
 * covers the debt and how much is paid out (`payoutMethod`), and the status.
 */
export function OrderReturnScreen({ orderId }: OrderReturnScreenProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: order, isLoading, isError, refetch } = useOrderById(orderId);

  const header = (subtitle?: string) => (
    <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" accessibilityRole="header">{t('orderReturn.title')}</Text>
        {subtitle ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );

  if (!canProcessReturns(user)) {
    return (
      <View className="flex-1 bg-bg">
        {header()}
        <EmptyState icon={Lock} message={t('orderReturn.noAccess')} />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header()}
        <LoadingState />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View className="flex-1 bg-bg">
        {header()}
        <EmptyState icon={CircleAlert} message={t('order.errorLoadingOrder')}>
          <Button variant="secondary" onPress={() => refetch()}>{t('sale.pay.retry')}</Button>
        </EmptyState>
      </View>
    );
  }

  const returnable = !order.isReturned && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DEBT);
  if (!returnable) {
    return (
      <View className="flex-1 bg-bg">
        {header(t('orderView.title', { no: orderNo(order.id) }))}
        <EmptyState icon={CircleAlert} message={order.isReturned ? t('orderReturn.alreadyReturned') : t('orderReturn.notReturnable')}>
          <Button variant="secondary" onPress={() => router.back()}>{t('common.back')}</Button>
        </EmptyState>
      </View>
    );
  }

  return <ReturnForm order={order} header={header} />;
}

interface ReturnFormProps {
  order: OrderDetail;
  header: (subtitle?: string) => ReactNode;
}

function ReturnForm({ order, header }: ReturnFormProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { data: openCashboxes } = useOpenCashboxes();
  const returnOrder = useReturnOrder();

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [comment, setComment] = useState('');
  const [payout, setPayout] = useState<Payout>('now');
  const [method, setMethod] = useState<PaymentType>(PaymentType.CASH);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = order.items ?? [];
  const unitOf = (item: OrderDetail['items'][number]) => Number(item.retailPrice) - Number(item.sale);
  const picked = items.filter((i) => (counts[i.id] ?? 0) > 0);
  const pieces = picked.reduce((sum, i) => sum + counts[i.id], 0);

  // Preview only — the backend prices the return and splits it.
  const refund = picked.reduce((sum, i) => sum + counts[i.id] * unitOf(i), 0);
  const debt = order.status === OrderStatus.DEBT ? order.settlement?.debt ?? 0 : 0;
  const debtCover = Math.min(refund, debt);
  const toCustomer = refund - debtCover;
  const nothing = refund === 0;
  const hasOwnCashbox = !!openCashboxes?.some((c) => c.isMine);

  const send = (cashboxId?: string) => {
    setError(null);
    returnOrder.mutate(
      {
        orderId: order.id,
        items: picked.map((i) => ({ itemId: i.id, quantity: counts[i.id] })),
        returnPayments: [],
        payoutMethod: toCustomer > 0 && payout === 'now' ? method : undefined,
        reason: reason ?? undefined,
        comment: comment.trim() || undefined,
        cashboxId,
      },
      {
        onSuccess: (res) => {
          toast.show(successText(res), 'success');
          router.back();
        },
        onError: (err) => setError(getApiErrorMessage(err, t('orderReturn.failed'))),
      },
    );
  };

  const successText = (res: ReturnOrderResult) => {
    const paidOut = Number(res.paidOut);
    const reduced = Number(res.totalAmount) - paidOut;
    if (res.status === ReturnOrderStatus.CREDIT && paidOut === 0) {
      return t('orderReturn.successLater');
    }
    if (paidOut > 0) {
      return t('orderReturn.successPaid', { amount: formatMoney(paidOut), method: t(`orderView.history.paidBy.${method}`) });
    }
    return t('orderReturn.successDebt', { amount: formatMoney(reduced) });
  };

  const submit = () => {
    if (nothing || returnOrder.isPending) return;
    // Money out now needs a cashbox: the own open one (the backend takes it) or a chosen one
    if (toCustomer > 0 && payout === 'now' && !hasOwnCashbox) setPickerOpen(true);
    else send();
  };

  const submitLabel = nothing
    ? t('orderReturn.submit')
    : toCustomer > 0 && payout === 'later'
      ? t('orderReturn.submitLater')
      : toCustomer > 0
        ? t('orderReturn.submitAmount', { amount: formatMoney(toCustomer) })
        : t('orderReturn.submitDebt', { amount: formatMoney(debtCover) });

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header(
        [
          t('orderView.title', { no: orderNo(order.id) }),
          formatDay(order.soldAt ?? order.createdAt, lang),
          order.status === OrderStatus.DEBT ? t('orderReturn.onDebt') : t('orderReturn.paid'),
        ].join(' · '),
      )}

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
      >
        {/* What comes back */}
        <View className="bg-card rounded-3xl px-3.5 py-4 gap-2.5">
          <View className="flex-row items-baseline justify-between px-0.5">
            <Text className="font-onest-bold text-[15px] text-ink">{t('orderReturn.what')}</Text>
            <Text className={cn('font-onest-semibold text-xs', pieces ? 'text-ink' : 'text-muted')}>
              {pieces ? t('orderReturn.picked', { count: pieces }) : t('orderReturn.nothingPicked')}
            </Text>
          </View>
          {items.map((item) => {
            const n = counts[item.id] ?? 0;
            const unit = unitOf(item);
            const label = variantLabel(
              (item.variant.attributes ?? []).map((a) => ({ value: a.value.valueString })),
              item.variant.sku,
            );
            return (
              <View
                key={item.id}
                className={cn('rounded-[18px] bg-sunken p-2.5 gap-2.5 border-2', n > 0 ? 'border-accent' : 'border-transparent')}
              >
                <View className="flex-row items-center gap-3">
                  <PhotoPlaceholder size="sm" className="rounded-xl" />
                  <View className="flex-1 min-w-0 gap-0.5">
                    <Text className="font-onest-bold text-[15px] text-ink" numberOfLines={2}>
                      {item.variant.product?.name ?? item.variant.sku}
                    </Text>
                    <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                      {[label, t('orderReturn.bought', { qty: item.quantity, price: formatMoney(unit) })].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2.5">
                  <Text className={cn('flex-1 font-onest-semibold text-[13px] tabular-nums', n ? 'text-ink' : 'text-muted')}>
                    {n
                      ? t('orderReturn.lineSum', { n, price: formatMoney(unit), sum: formatMoney(n * unit) })
                      : t('orderReturn.notReturned')}
                  </Text>
                  <Stepper
                    value={n}
                    min={0}
                    max={item.quantity}
                    size="sm"
                    onChange={(v) => setCounts((c) => ({ ...c, [item.id]: v }))}
                  />
                  <Text className="font-onest text-xs text-muted">{t('orderReturn.of', { qty: item.quantity })}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Reason — information only */}
        <View className="bg-card rounded-3xl px-3.5 py-4 gap-3">
          <Text className="font-onest-bold text-[15px] text-ink px-0.5">{t('orderReturn.reason')}</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {REASONS.map((r) => {
              const on = r === reason;
              return (
                <Pressable
                  key={r}
                  onPress={() => setReason(on ? null : r)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  className={cn('h-[38px] px-3.5 rounded-pill items-center justify-center', on ? 'bg-primary' : 'bg-sunken')}
                >
                  <Text className={cn('font-onest-semibold text-[13px]', on ? 'text-on-primary' : 'text-ink')}>
                    {t(`orderReturn.reasons.${r}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            maxLength={COMMENT_MAX}
            placeholder={t('orderReturn.commentPlaceholder')}
            placeholderTextColor={colors.muted}
            accessibilityLabel={t('orderReturn.commentPlaceholder')}
            className="h-12 px-3.5 rounded-2xl bg-sunken font-onest-medium text-sm text-ink"
          />
          <Text className="font-onest text-xs text-muted px-0.5">
            {order.warehouse?.name ? t('orderReturn.toStock', { warehouse: order.warehouse.name }) : t('orderReturn.toStockNoName')}
          </Text>
        </View>

        {/* Hero: preview of the return */}
        <View className="bg-hero rounded-[28px] p-5 gap-2.5">
          {picked.length ? (
            picked.map((i) => (
              <View key={i.id} className="flex-row justify-between gap-3">
                <Text className="flex-1 font-onest text-sm text-hero-muted" numberOfLines={1}>
                  {`${i.variant.product?.name ?? i.variant.sku} · ${counts[i.id]} × ${formatMoney(unitOf(i))}`}
                </Text>
                <Text className="font-onest-semibold text-sm text-hero-ink tabular-nums">{formatMoney(counts[i.id] * unitOf(i))}</Text>
              </View>
            ))
          ) : (
            <View className="flex-row justify-between">
              <Text className="font-onest text-sm text-hero-muted">{t('orderReturn.noItems')}</Text>
              <Text className="font-onest-semibold text-sm text-hero-ink">—</Text>
            </View>
          )}
          <View className="h-px bg-hero-sub my-0.5" />

          {debt > 0 && debtCover > 0 ? (
            <View className="gap-2">
              <Text className="font-onest-semibold text-sm text-hero-info">{t('orderReturn.debtReduces')}</Text>
              <Text className="font-onest-bold text-[32px] tracking-[-0.6px] text-hero-ink tabular-nums">
                {formatMoney(debtCover)} <Text className="font-onest-medium text-[15px] text-hero-muted">UZS</Text>
              </Text>
              <View className="flex-row gap-2">
                <View className="flex-1 rounded-2xl bg-hero-sub px-3 py-2.5 gap-0.5">
                  <Text className="font-onest text-xs text-hero-muted">{t('orderReturn.debtWas')}</Text>
                  <Text className="font-onest-bold text-base text-hero-ink tabular-nums">{formatMoney(debt)}</Text>
                </View>
                <View className="flex-1 rounded-2xl bg-hero-sub px-3 py-2.5 gap-0.5">
                  <Text className="font-onest-semibold text-xs text-hero-err">{t('orderReturn.debtWillBe')}</Text>
                  <Text className="font-onest-bold text-base text-hero-err tabular-nums">{formatMoney(debt - debtCover)}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {toCustomer > 0 || debtCover === 0 ? (
            <View className="gap-1">
              <Text className="font-onest-semibold text-sm text-hero-warn">{t('orderReturn.toCustomer')}</Text>
              <Text className="font-onest-bold text-[32px] tracking-[-0.6px] text-hero-ink tabular-nums">
                {formatMoney(toCustomer)} <Text className="font-onest-medium text-[15px] text-hero-muted">UZS</Text>
              </Text>
            </View>
          ) : null}
        </View>

        {/* How the money goes back */}
        {toCustomer > 0 ? (
          <View className="bg-card rounded-3xl px-3.5 py-4 gap-3">
            <Text className="font-onest-bold text-[15px] text-ink px-0.5">{t('orderReturn.howBack')}</Text>
            <Segmented
              variant="sunken"
              options={[
                { value: 'now' as Payout, label: t('orderReturn.payNow') },
                { value: 'later' as Payout, label: t('orderReturn.payLater') },
              ]}
              value={payout}
              onChange={setPayout}
            />
            {payout === 'now' ? (
              <>
                <View className="flex-row gap-1.5">
                  {PAYMENT_METHODS.map(({ type }) => {
                    const on = type === method;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setMethod(type)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        className={cn('flex-1 h-12 rounded-[14px] items-center justify-center px-1', on ? 'bg-primary' : 'bg-sunken')}
                      >
                        <Text className={cn('font-onest-semibold text-xs', on ? 'text-on-primary' : 'text-ink')} numberOfLines={1}>
                          {t(`sale.pay.method.${type}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text className="font-onest text-xs text-muted px-0.5">
                  {hasOwnCashbox ? t('orderReturn.fromOwnCashbox') : t('orderReturn.pickCashbox')}
                </Text>
              </>
            ) : (
              <Text className="font-onest text-[13px] leading-[18px] text-muted px-0.5">
                {t('orderReturn.laterNote', { amount: formatMoney(toCustomer) })}
              </Text>
            )}
          </View>
        ) : null}

        {debt > 0 ? (
          <View className="flex-row items-start gap-2.5 rounded-[18px] bg-info-bg px-3.5 py-3">
            <Info size={18} color={colors.infoFg} strokeWidth={2} />
            <Text className="flex-1 font-onest-semibold text-[13px] leading-[18px] text-info-fg">{t('orderReturn.debtNote')}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="px-4 pt-3 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
        {error ? (
          <View className="flex-row items-start gap-2 bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <CircleAlert size={16} color={colors.errFg} strokeWidth={2} />
            <Text className="flex-1 font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}
        {nothing ? <Text className="font-onest text-xs text-muted text-center">{t('orderReturn.hint')}</Text> : null}
        <Button variant="accent" size="lg" full disabled={nothing} loading={returnOrder.isPending} onPress={submit}>
          {submitLabel}
        </Button>
      </View>

      <CashboxPickerSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(cashboxId) => {
          setPickerOpen(false);
          send(cashboxId);
        }}
      />
    </KeyboardAvoidingView>
  );
}
