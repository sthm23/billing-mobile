import { Avatar, AvatarFallbackText, Button, IconButton, Money, PhotoPlaceholder, StatusBadge, Text, toast } from '@/components/base';
import { CashboxPickerSheet } from '@/components/cashbox';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { canProcessReturns } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { CashTransactionCategory, CashTransactionType } from '@/models/payment.model';
import { useAuth } from '@/provider/AuthProvider';
import { AddTransactionSheet } from '@/screens/payment/AddTransactionSheet';
import { formatDay, formatDayTime } from '@/screens/rental/rental-format';
import { useCreateTransaction, useOpenCashboxes } from '@/services/cashbox';
import type { CreateTransactionPayload } from '@/services/cashbox/cashbox.types';
import { OrderStatus, ReturnOrderStatus, type OrderDetail } from '@/services/order/order.type';
import { router } from 'expo-router';
import { formatPhone } from '@/screens/profile/staff/staff-format';
import { ChevronLeft, Phone, ShieldAlert, Undo2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { variantLabel } from '../cart/cart-store';
import { orderBadges, orderNo } from '../order-status';
import { RefundPayoutSheet } from './RefundPayoutSheet';
import { useTheme } from '@/hooks/use-theme';

interface OrderViewScreenProps {
  order: OrderDetail;
  refetch: () => Promise<unknown>;
}

type HistoryRow = {
  key: string;
  sign: string;
  tone: 'ok' | 'err' | 'warn' | 'neutral';
  title: string;
  sub: string;
  amount: string;
};

const TONE_ICON: Record<HistoryRow['tone'], string> = {
  ok: 'bg-ok-bg',
  err: 'bg-err-bg',
  warn: 'bg-warn-bg',
  neutral: 'bg-sunken',
};
const TONE_TEXT: Record<HistoryRow['tone'], string> = {
  ok: 'text-ok-fg',
  err: 'text-err-fg',
  warn: 'text-warn-fg',
  neutral: 'text-ink',
};

/**
 * A sold order, read-only (design «OrderDone» / «OrderDoneDebt» /
 * «OrderDoneReturned»): totals, customer, items with returned units, the
 * history of payments and the return, and actions — debt payment, return,
 * refund payout (CREDIT) and a defect compensation. Every amount comes from
 * the backend (`settlement`); the screen only displays it.
 */
export function OrderViewScreen({ order, refetch }: OrderViewScreenProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const refreshControl = useRefreshControl(refetch);
  const { data: openCashboxes, refetch: refetchCashboxes } = useOpenCashboxes();
  const createTransaction = useCreateTransaction();

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [compensationCashbox, setCompensationCashbox] = useState<string | null>(null);

  const ret = order.returns;
  const { debt, owedToCustomer } = order.settlement ?? { debt: 0, owedToCustomer: 0, refundedOut: 0 };
  const total = Number(order.totalAmount);
  const returned = Number(order.returnedAmount ?? 0);
  // Display only: what stays with the store after the return
  const netTotal = total - returned;
  const sold = order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DEBT || order.status === OrderStatus.REFUNDED;
  const manager = canProcessReturns(user);
  const canReturn = manager && !order.isReturned && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DEBT);
  const canPayout = manager && !!ret && ret.status === ReturnOrderStatus.CREDIT && owedToCustomer > 0;
  const canPayDebt = debt > 0 && order.status === OrderStatus.DEBT && !!order.customer;
  const customerName = order.customer?.user.fullName;

  const items = order.items ?? [];
  const units = items.reduce((sum, i) => sum + i.quantity, 0);
  const returnedUnits = items.reduce((sum, i) => sum + (i.returnedQuantity ?? 0), 0);

  // --- Hero pills
  const pills: { key: string; label: string; value: number; tone: 'accent' | 'err' | 'warn' | 'muted' }[] = [
    { key: 'paid', label: t('orderView.paid'), value: Number(order.paidAmount), tone: 'accent' },
  ];
  if (debt > 0 || !order.isReturned) {
    pills.push({ key: 'debt', label: t('orderView.debt'), value: debt, tone: debt > 0 ? 'err' : 'muted' });
  }
  if (order.isReturned) {
    pills.push({ key: 'returned', label: t('orderView.returned'), value: returned, tone: 'warn' });
  }

  // --- Info rows
  const info: { key: string; label: string; value: string; tone?: 'err' }[] = [];
  const customerPhone = order.customer?.user.phone;
  if (order.warehouse?.name) info.push({ key: 'warehouse', label: t('orderView.warehouse'), value: order.warehouse.name });
  if (order.cashier?.user?.fullName) info.push({ key: 'seller', label: t('orderView.seller'), value: order.cashier.user.fullName });
  if (debt > 0 && order.debtDueAt) {
    const overdue = new Date(order.debtDueAt).getTime() < Date.now();
    info.push({
      key: 'due',
      label: t('orderView.dueAt'),
      value: overdue ? t('orderView.overdueSince', { date: formatDay(order.debtDueAt, lang) }) : formatDay(order.debtDueAt, lang),
      tone: overdue ? 'err' : undefined,
    });
  }

  // --- History: payments, the debt left, the return and its payouts
  const history: HistoryRow[] = order.payments.map((p) => ({
    key: p.id,
    sign: '+',
    tone: 'ok',
    title: t(`sale.pay.method.${p.type}`),
    sub: [formatDayTime(p.createdAt, lang), p.cashier?.user.fullName].filter(Boolean).join(' · '),
    amount: `+${formatMoney(p.amount)}`,
  }));
  if (debt > 0) {
    history.push({
      key: 'debt',
      sign: '!',
      tone: 'err',
      title: t('orderView.history.debt'),
      sub: order.debtDueAt ? t('orderView.history.dueBy', { date: formatDay(order.debtDueAt, lang) }) : t('orderView.history.noTerm'),
      amount: formatMoney(debt),
    });
  }
  if (ret) {
    const lines = ret.items
      .map((ri) => {
        const item = items.find((i) => i.id === ri.itemId);
        return item ? `${item.variant.product?.name ?? item.variant.sku} ${ri.quantity}` : null;
      })
      .filter(Boolean)
      .join(', ');
    const settledBy =
      ret.payments.length > 0
        ? ret.payments.map((p) => t(`orderView.history.paidBy.${p.type}`)).join(', ')
        : ret.status === ReturnOrderStatus.CREDIT
          ? t('orderView.history.payLater')
          : t('orderView.history.againstDebt');
    history.push({
      key: ret.id,
      sign: '↩',
      tone: 'warn',
      title: [t('orderView.history.return', { no: orderNo(ret.id) }), lines].filter(Boolean).join(' · '),
      sub: [formatDayTime(ret.createdAt, lang), t(`orderView.reason.${ret.reason}`), ret.comment, settledBy].filter(Boolean).join(' · '),
      amount: `−${formatMoney(ret.totalAmount)}`,
    });
    ret.payments.forEach((p) =>
      history.push({
        key: p.id,
        sign: '−',
        tone: 'neutral',
        title: t('orderView.history.payout', { method: t(`sale.pay.method.${p.type}`) }),
        sub: [formatDayTime(p.createdAt, lang), p.cashier?.user.fullName].filter(Boolean).join(' · '),
        amount: `−${formatMoney(p.amount)}`,
      }),
    );
  }

  // --- Defect compensation: an expense of an open cashbox linked to the order
  const startCompensation = () => {
    const mine = openCashboxes?.find((c) => c.isMine);
    if (mine) setCompensationCashbox(mine.id);
    else setPickerOpen(true);
  };

  const pickCompensationCashbox = async (cashboxId: string | undefined) => {
    setPickerOpen(false);
    if (cashboxId) {
      setCompensationCashbox(cashboxId);
      return;
    }
    // The employee's own cashbox was just opened
    const { data } = await refetchCashboxes();
    const mine = data?.find((c) => c.isMine);
    if (mine) setCompensationCashbox(mine.id);
  };

  const saveCompensation = async (payload: CreateTransactionPayload) => {
    try {
      await createTransaction.mutateAsync(payload);
      toast.show(t('orderView.compensation.success', { amount: formatMoney(payload.amount) }), 'success');
      setCompensationCashbox(null);
    } catch (err) {
      toast.show(getApiErrorMessage(err, t('orderView.compensation.failed')), 'error');
    }
  };

  const hasActions = canPayDebt || canPayout || canReturn;

  return (
    <View className="flex-1 bg-bg">
      <View className="flex-row items-start gap-2.5 px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('order.back')} onPress={() => router.back()} />
        <View className="flex-1 min-w-0 gap-1">
          <Text className="type-heading text-ink" accessibilityRole="header">
            {t('orderView.title', { no: orderNo(order.id) })}
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {orderBadges(order, t).map((b) => (
              <StatusBadge key={b.label} label={b.label} tone={b.tone} size="sm" />
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
      >
        {/* Hero: total (after the return) and pills */}
        <View className="bg-hero rounded-[28px] p-5 gap-3">
          <View className="flex-row items-baseline justify-between gap-2">
            <Text className="font-onest text-sm text-hero-muted">
              {order.isReturned ? t('orderView.totalAfterReturn') : t('orderView.total')}
            </Text>
            <Text className="font-onest text-[13px] text-hero-muted" numberOfLines={1}>
              {formatDayTime(order.soldAt ?? order.createdAt, lang)}
            </Text>
          </View>
          <View className="flex-row flex-wrap items-baseline gap-2.5">
            <Money value={netTotal} className="text-[32px] tracking-[-0.6px] text-hero-ink" currencyClassName="text-[15px] text-hero-muted" />
            {order.isReturned ? (
              <Text className="font-onest text-[15px] text-hero-muted line-through tabular-nums">{formatMoney(total)}</Text>
            ) : null}
          </View>
          <View className="flex-row gap-2">
            {pills.map((p) => (
              <View key={p.key} className={cn('flex-1 min-w-0 rounded-2xl px-3 py-2.5 gap-0.5', p.tone === 'accent' ? 'bg-accent' : 'bg-hero-sub')}>
                <Text
                  className={cn(
                    'font-onest-semibold text-xs',
                    { accent: 'text-on-accent', err: 'text-hero-err', warn: 'text-hero-warn', muted: 'text-hero-muted' }[p.tone],
                  )}
                  numberOfLines={1}
                >
                  {p.label}
                </Text>
                <Text
                  className={cn(
                    'font-onest-bold text-[17px] tabular-nums',
                    { accent: 'text-on-accent', err: 'text-hero-err', warn: 'text-hero-warn', muted: 'text-hero-muted' }[p.tone],
                  )}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatMoney(p.value)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* The store owes the customer (return paid out later) */}
        {owedToCustomer > 0 ? (
          <View className="flex-row items-start gap-3 bg-warn-bg rounded-xl p-3.5" accessibilityRole="alert">
            <ShieldAlert size={20} color={colors.warnFg} strokeWidth={2} />
            <View className="flex-1 min-w-0 gap-0.5">
              <Text className="font-onest-bold text-[15px] text-warn-fg">
                {t('orderView.owed.title', { amount: formatMoney(owedToCustomer) })}
              </Text>
              <Text className="font-onest text-[13px] leading-[18px] text-warn-fg">{t('orderView.owed.text')}</Text>
            </View>
          </View>
        ) : null}

        {/* Customer (call), warehouse, seller, repay-by */}
        {customerName || info.length > 0 ? (
          <View className="bg-card rounded-3xl px-4 py-1">
            {customerName ? (
              <View className="flex-row items-center gap-3 py-3">
                <Avatar tone="accent">
                  <AvatarFallbackText>{customerName}</AvatarFallbackText>
                </Avatar>
                <View className="flex-1 min-w-0 gap-0.5">
                  <Text className="font-onest text-xs text-muted">{t('orderView.customer')}</Text>
                  <Text className="font-onest-semibold text-[15px] text-ink" numberOfLines={1}>{customerName}</Text>
                  {customerPhone ? (
                    <Text className="font-onest text-[13px] text-soft" numberOfLines={1}>{formatPhone(customerPhone)}</Text>
                  ) : null}
                </View>
                {customerPhone ? (
                  <IconButton
                    icon={Phone}
                    variant="sunken"
                    accessibilityLabel={t('orderView.call')}
                    onPress={() => void Linking.openURL(`tel:${customerPhone.replace(/[^\d+]/g, '')}`)}
                  />
                ) : null}
              </View>
            ) : null}
            {info.map((r, i) => (
              <View
                key={r.key}
                className={cn('min-h-12 flex-row items-center justify-between gap-3', (i > 0 || customerName) && 'border-t border-line')}
              >
                <Text className="font-onest text-sm text-muted">{r.label}</Text>
                <Text
                  className={cn('flex-1 font-onest-semibold text-[15px] text-right', r.tone === 'err' ? 'text-err-fg' : 'text-ink')}
                  numberOfLines={2}
                >
                  {r.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Items */}
        <View className="bg-card rounded-3xl p-3.5 gap-2">
          <View className="flex-row items-baseline justify-between px-0.5 pb-0.5">
            <Text className="font-onest-bold text-[15px] text-ink">{t('orderView.items', { count: items.length })}</Text>
            <Text className="font-onest text-xs text-muted">
              {returnedUnits > 0 ? t('orderView.returnedUnits', { count: returnedUnits }) : t('orderView.units', { count: units })}
            </Text>
          </View>
          {items.map((item) => {
            const unit = Number(item.retailPrice) - Number(item.sale);
            const back = item.returnedQuantity ?? 0;
            const left = item.quantity - back;
            const label = variantLabel(
              (item.variant.attributes ?? []).map((a) => ({ value: a.value.valueString })),
              item.variant.sku,
            );
            return (
              <View key={item.id} className="flex-row items-center gap-3 p-2.5 rounded-2xl bg-sunken">
                <PhotoPlaceholder size="sm" className="rounded-xl" />
                <View className="flex-1 min-w-0 gap-[3px]">
                  <Text className="font-onest-bold text-[15px] text-ink" numberOfLines={2}>
                    {item.variant.product?.name ?? item.variant.sku}
                  </Text>
                  <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                    {[
                      label,
                      back > 0
                        ? t('orderView.calcReturned', { left, qty: item.quantity, price: formatMoney(unit) })
                        : t('orderView.calc', { qty: item.quantity, price: formatMoney(unit) }),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  {back > 0 ? (
                    <View className="self-start rounded-pill bg-warn-bg px-2 py-0.5">
                      <Text className="font-onest-semibold text-[11px] text-warn-fg">{t('orderView.returnedBadge', { count: back })}</Text>
                    </View>
                  ) : null}
                </View>
                <View className="items-end gap-0.5">
                  {back > 0 ? (
                    <Text className="font-onest text-xs text-muted line-through tabular-nums">{formatMoney(unit * item.quantity)}</Text>
                  ) : null}
                  <Text className="font-onest-bold text-[15px] text-ink tabular-nums">{formatMoney(unit * left)}</Text>
                </View>
              </View>
            );
          })}
          {(order.services ?? []).map((s) => (
            <View key={s.id} className="flex-row items-center justify-between gap-3 px-2.5 py-2">
              <Text className="flex-1 font-onest text-sm text-soft" numberOfLines={1}>{s.name}</Text>
              <Text className="font-onest-semibold text-sm text-ink tabular-nums">{formatMoney(s.price)}</Text>
            </View>
          ))}
        </View>

        {/* Payments and the return */}
        {history.length > 0 ? (
          <View className="bg-card rounded-3xl p-3.5 gap-1">
            <Text className="font-onest-bold text-[15px] text-ink px-0.5 pb-1.5">{t('orderView.history.title')}</Text>
            {history.map((h, i) => (
              <View key={h.key} className={cn('flex-row items-center gap-3 py-2.5 px-0.5', i > 0 && 'border-t border-line')}>
                <View className={cn('w-9 h-9 rounded-xl items-center justify-center', TONE_ICON[h.tone])}>
                  <Text className={cn('font-onest-bold text-[15px]', TONE_TEXT[h.tone])}>{h.sign}</Text>
                </View>
                <View className="flex-1 min-w-0 gap-0.5">
                  <Text className="font-onest-semibold text-sm text-ink" numberOfLines={2}>{h.title}</Text>
                  <Text className="font-onest text-xs text-muted" numberOfLines={2}>{h.sub}</Text>
                </View>
                <Text className={cn('font-onest-bold text-[15px] tabular-nums', TONE_TEXT[h.tone])}>{h.amount}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Defect compensation: money for a defective item the store does not take back */}
        {manager && sold ? (
          <View className="bg-card rounded-3xl p-3.5 gap-2">
            <Text className="font-onest text-[13px] leading-[18px] text-muted px-0.5">{t('orderView.compensation.hint')}</Text>
            <Button variant="secondary" full onPress={startCompensation}>
              {t('orderView.compensation.button')}
            </Button>
          </View>
        ) : null}
      </ScrollView>

      {hasActions ? (
        <View className="px-4 pt-3 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
          {canPayDebt ? (
            <Button
              variant="accent"
              size="lg"
              full
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/(orders)/debt-pay',
                  params: { customerId: order.customer.id, id: order.id },
                })
              }
            >
              {t('orderView.payDebt', { amount: formatMoney(debt) })}
            </Button>
          ) : null}
          {canPayout ? (
            <Button variant="accent" size="lg" full onPress={() => setPayoutOpen(true)}>
              {t('orderView.payout.button', { amount: formatMoney(owedToCustomer) })}
            </Button>
          ) : null}
          {canReturn ? (
            <Button
              variant={canPayDebt ? 'secondary' : 'primary'}
              size="lg"
              full
              icon={Undo2}
              onPress={() => router.push({ pathname: '/(tabs)/(orders)/return/[id]', params: { id: order.id } })}
            >
              {t('orderView.returnGoods')}
            </Button>
          ) : null}
        </View>
      ) : null}

      {ret && canPayout ? (
        <RefundPayoutSheet
          isOpen={payoutOpen}
          onClose={() => setPayoutOpen(false)}
          returnId={ret.id}
          amount={owedToCustomer}
          customerName={customerName}
        />
      ) : null}

      <CashboxPickerSheet isOpen={pickerOpen} onClose={() => setPickerOpen(false)} onPick={pickCompensationCashbox} />

      {manager && sold ? (
        <AddTransactionSheet
          isOpen={!!compensationCashbox}
          onClose={() => setCompensationCashbox(null)}
          cashboxId={compensationCashbox ?? ''}
          transactionType={CashTransactionType.EXPENSE}
          defaultCategory={CashTransactionCategory.DEFECT_COMPENSATION}
          lockCategory
          orderId={order.id}
          title={t('orderView.compensation.title', { no: orderNo(order.id) })}
          note={t('orderView.compensation.note')}
          onSubmit={saveCompensation}
          isLoading={createTransaction.isPending}
        />
      ) : null}
    </View>
  );
}
