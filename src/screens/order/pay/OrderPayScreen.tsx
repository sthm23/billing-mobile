import { Button, IconButton, Money, Pressable, Text } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import {
  CustomerPickerSheet,
  EMPTY_PAYMENT_AMOUNTS,
  PAYMENT_METHODS,
  PaymentMethodsInput,
  amountOf as enteredFor,
  totalEntered,
  type PaymentAmounts,
} from '@/components/order';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import type { OrderCustomer } from '@/services/customer';
import { useCreateOrderPayment, useOrderById } from '@/services/order/order.queries';
import { orderService } from '@/services/order/order.service';
import { OrderStatus, PaymentType, type OrderPaymentPayload } from '@/services/order/order.type';
import { router } from 'expo-router';
import { ChevronDown, ChevronLeft, CircleAlert, Plus, UserRound, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { variantLabel } from '../cart/cart-store';

interface OrderPayScreenProps {
  orderId: string;
}

/**
 * Order payment (design «OrderPay»): split by methods, cash change, the rest
 * as debt for a chosen customer. The backend checks the amounts again and
 * deducts stock; overpayment is never sent — cash is reduced by the change.
 */
export function OrderPayScreen({ orderId }: OrderPayScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { data: order, isLoading, isError, refetch } = useOrderById(orderId);
  const payOrder = useCreateOrderPayment();
  const [selected, setSelected] = useState<PaymentType[]>([PaymentType.CASH]);
  const [amounts, setAmounts] = useState<PaymentAmounts>(EMPTY_PAYMENT_AMOUNTS);
  const [customer, setCustomer] = useState<OrderCustomer | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (order?.customer) {
      setCustomer({ id: order.customer.id, fullName: order.customer.user.fullName, phone: order.customer.user.phone });
    }
  }, [order?.customer]);

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  if (isError || !order) {
    return (
      <EmptyState icon={CircleAlert} message={t('order.errorLoadingOrder')}>
        <Button variant="secondary" onPress={() => refetch()}>{t('sale.pay.retry')}</Button>
      </EmptyState>
    );
  }

  if (order.status !== OrderStatus.HOLD) {
    const message =
      order.status === OrderStatus.COMPLETED
        ? t('sale.pay.alreadyPaid')
        : order.status === OrderStatus.DEBT
          ? t('sale.pay.debtLater')
          : t('sale.pay.notPayable');
    return (
      <EmptyState icon={CircleAlert} message={message}>
        <Button variant="secondary" onPress={() => router.back()}>{t('order.back')}</Button>
      </EmptyState>
    );
  }

  // Display values from the saved order; the backend validates the payment.
  const total = Number(order.totalAmount) - Number(order.paidAmount);
  const subtotal = order.items.reduce((acc, i) => acc + Number(i.retailPrice) * i.quantity, 0);
  const discount = order.items.reduce((acc, i) => acc + Number(i.sale) * i.quantity, 0);
  const amountOf = (type: PaymentType) => enteredFor(selected, amounts, type);
  const paid = totalEntered(selected, amounts);
  const rest = total - paid;
  const change = rest < 0 ? -rest : 0;
  const cashIn = amountOf(PaymentType.CASH);

  let status: { text: string; tone: 'muted' | 'ok' | 'warn' | 'err' };
  let payLabel = t('sale.pay.confirm');
  let canPay = false;
  if (rest === 0) {
    status = { text: t('sale.pay.statusFull'), tone: 'ok' };
    canPay = true;
  } else if (rest < 0) {
    if (cashIn >= change) {
      status = { text: t('sale.pay.statusChange', { amount: formatMoney(change) }), tone: 'ok' };
      payLabel = t('sale.pay.confirmWithChange', { amount: formatMoney(change) });
      canPay = true;
    } else {
      status = { text: t('sale.pay.statusOverpay', { amount: formatMoney(change) }), tone: 'err' };
    }
  } else if (customer) {
    status = { text: t('sale.pay.statusDebt', { amount: formatMoney(rest) }), tone: 'warn' };
    payLabel = t('sale.pay.confirmDebt');
    canPay = true;
  } else {
    status = { text: t('sale.pay.statusNeedCustomer', { amount: formatMoney(rest) }), tone: 'warn' };
  }

  const submit = async () => {
    if (!canPay || submitting) return;
    // Change is given from cash: send only what stays in the till.
    const payments: OrderPaymentPayload[] = PAYMENT_METHODS.map((m) => ({
      type: m.type,
      amount: m.type === PaymentType.CASH ? amountOf(m.type) - change : amountOf(m.type),
      paidAt: null,
    })).filter((p) => p.amount > 0);

    setError(null);
    setSubmitting(true);
    try {
      // Removing the customer of a fully paid order: the payment keeps the order's customer otherwise.
      if (order.customer && !customer) {
        await orderService.clearCustomerFromOrder(order.id);
      }
      await payOrder.mutateAsync({
        orderId: order.id,
        body: { orderId: order.id, customerId: customer?.id ?? null, payments },
      });
      Alert.alert(
        t('sale.pay.successTitle'),
        change > 0 ? t('sale.pay.successChange', { amount: formatMoney(change) }) : t('sale.pay.successText')
      );
      router.dismissAll();
      router.push({ pathname: '/(tabs)/(orders)/[id]', params: { id: order.id } });
    } catch (err) {
      setError(getApiErrorMessage(err, t('sale.pay.failed')));
    } finally {
      setSubmitting(false);
    }
  };

  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const statusColor = {
    muted: 'text-muted',
    ok: 'text-ok-fg',
    warn: 'text-warn-fg',
    err: 'text-err-fg',
  }[status.tone];

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('order.back')} onPress={() => router.back()} />
        <View className="flex-1 min-w-0">
          <Text className="type-heading text-ink" accessibilityRole="header">{t('sale.pay.title')}</Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {order.warehouse?.name ? `${order.warehouse.name} · ` : ''}
            {new Date(order.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
      >
        {/* Hero: amount due and progress */}
        <View className="bg-hero rounded-2xl p-[18px] gap-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-onest text-sm text-hero-muted">{t('sale.pay.due')}</Text>
            {discount > 0 && (
              <Text className="font-onest text-[13px] text-hero-muted tabular-nums">
                {formatMoney(subtotal)} <Text className="text-hero-err">−{formatMoney(discount)}</Text>
              </Text>
            )}
          </View>
          <Money value={total} className="text-[32px] tracking-[-0.6px] text-hero-ink" currencyClassName="text-[15px] text-hero-muted" />
          <View className="h-2 rounded bg-hero-sub overflow-hidden">
            <View className="h-2 rounded bg-accent" style={{ width: `${progress}%` }} />
          </View>
          <View className="flex-row justify-between">
            <Text className="font-onest text-[13px] text-hero-muted">
              {t('sale.pay.paid')} <Text className="font-onest-semibold text-hero-ink tabular-nums">{formatMoney(paid)}</Text>
            </Text>
            <Text className="font-onest text-[13px] text-hero-muted">
              {rest < 0 ? t('sale.pay.change') : t('sale.pay.left')}{' '}
              <Text className={cn('font-onest-bold tabular-nums', rest > 0 ? 'text-hero-warn' : 'text-accent')}>
                {formatMoney(Math.abs(rest))}
              </Text>
            </Text>
          </View>
        </View>

        {/* Customer */}
        <View className="flex-row items-center gap-3 bg-card rounded-lg py-3 pl-3.5 pr-3">
          <View className={cn('w-11 h-11 rounded-full items-center justify-center', customer ? 'bg-accent' : 'bg-sunken')}>
            <UserRound size={20} color={customer ? colors.onAccent : colors.muted} strokeWidth={2} />
          </View>
          <View className="flex-1 min-w-0 gap-0.5">
            <Text className="font-onest text-xs text-muted">{t('sale.customer.label')}</Text>
            <Text className="font-onest-semibold text-[15px] text-ink" numberOfLines={1}>
              {customer ? customer.fullName : t('sale.customer.notSelected')}
            </Text>
          </View>
          {customer ? (
            <IconButton icon={X} variant="sunken" accessibilityLabel={t('sale.customer.clear')} onPress={() => setCustomer(null)} />
          ) : (
            <Button variant="primary" size="sm" icon={Plus} onPress={() => setCustomerOpen(true)}>
              {t('sale.customer.pick')}
            </Button>
          )}
        </View>

        {/* Methods */}
        <PaymentMethodsInput
          selected={selected}
          amounts={amounts}
          onSelectedChange={setSelected}
          onAmountsChange={setAmounts}
          due={total}
        />

        {/* Items */}
        <View className="bg-card rounded-3xl px-3.5 py-1.5">
          <Pressable
            onPress={() => setItemsOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: itemsOpen }}
            className="h-12 flex-row items-center justify-between"
          >
            <Text className="font-onest-bold text-[15px] text-ink">{t('sale.pay.items', { count: order.items.length })}</Text>
            <View className="flex-row items-center gap-1.5">
              <Text className="font-onest-medium text-[13px] text-muted">{itemsOpen ? t('sale.pay.hide') : t('sale.pay.show')}</Text>
              <ChevronDown
                size={18}
                color={colors.muted}
                strokeWidth={2}
                style={{ transform: [{ rotate: itemsOpen ? '180deg' : '0deg' }] }}
              />
            </View>
          </Pressable>
          {itemsOpen &&
            order.items.map((item) => {
              const unit = Number(item.retailPrice) - Number(item.sale);
              return (
                <View key={item.id} className="flex-row items-center gap-2.5 py-2.5 border-t border-line">
                  <View className="flex-1 min-w-0 gap-0.5">
                    <Text className="font-onest-semibold text-sm text-ink" numberOfLines={1}>
                      {item.variant.product?.name ?? item.variant.sku}
                    </Text>
                    <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                      {variantLabel(
                        (item.variant.attributes ?? []).map((a) => ({ value: a.value.valueString })),
                        item.variant.sku
                      )}{' '}
                      · {item.quantity} × {formatMoney(unit)}
                    </Text>
                  </View>
                  <Money value={unit * item.quantity} currency={null} className="text-sm" />
                </View>
              );
            })}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View className="bg-card px-4 pt-3 gap-2 border-t border-line" style={{ paddingBottom: insets.bottom + 12 }}>
        {error && (
          <View className="flex-row items-center gap-2 rounded-2xl bg-err-bg px-3.5 py-2.5">
            <CircleAlert size={18} color={colors.errFg} strokeWidth={2} />
            <Text className="flex-1 font-onest text-[13px] text-err-fg">{error}</Text>
          </View>
        )}
        <Text className={cn('font-onest-semibold text-[13px] text-center', statusColor)}>{status.text}</Text>
        <Button variant="accent" size="lg" full onPress={submit} disabled={!canPay || submitting} loading={submitting}>
          {payLabel}
        </Button>
      </View>

      <CustomerPickerSheet
        isOpen={customerOpen}
        selectedId={customer?.id}
        onClose={() => setCustomerOpen(false)}
        onSelect={(picked) => {
          setCustomer(picked);
          setCustomerOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}
