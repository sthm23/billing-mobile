import { Button, IconButton, Money, Pressable, StatusBadge, Text, toast } from '@/components/base';
import { CashboxPickerSheet } from '@/components/cashbox';
import { CustomerPickerSheet } from '@/components/order';
import { EmptyState, LoadingState } from '@/components/common';
import {
  EMPTY_PAYMENT_AMOUNTS,
  PAYMENT_METHODS,
  PaymentMethodsInput,
  amountOf,
  totalEntered,
  type PaymentAmounts,
} from '@/components/order';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatDate, formatTime } from '@/libs/date';
import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import { useOpenCashboxes } from '@/services/cashbox';
import type { OrderCustomer } from '@/services/customer';
import { useDebtor, useRepayDebt, type DebtKind } from '@/services/debt';
import { PaymentType } from '@/services/order/order.type';
import { router } from 'expo-router';
import { ChevronDown, ChevronLeft, CircleAlert, Plus, UserRound, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DebtPayScreenProps {
  customerId: string;
  kind: DebtKind;
  /** Order id or manual debt id */
  id: string;
}

/**
 * «Погашение долга» (design «OrderPay», debt mode): one debt of a customer,
 * split by methods, cash change. The money goes to the employee's open
 * cashbox; without one the cashbox picker opens. The backend validates.
 */
export function DebtPayScreen({ customerId, kind, id }: DebtPayScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useDebtor(customerId);
  const { data: openCashboxes } = useOpenCashboxes();
  const repay = useRepayDebt();
  const [selected, setSelected] = useState<PaymentType[]>([PaymentType.CASH]);
  const [amounts, setAmounts] = useState<PaymentAmounts>(EMPTY_PAYMENT_AMOUNTS);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Order without a customer: optionally attach one with this payment
  const [attachTo, setAttachTo] = useState<OrderCustomer | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debt = data?.debts.find((d) => d.kind === kind && d.id === id);

  const header = (
    <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" accessibilityRole="header">{t('debtors.pay.title')}</Text>
        {debt ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {[
              kind === 'ORDER' ? t('debtors.order') : debt.description || t('debtors.manual'),
              debt.warehouse?.name,
              t('debtors.from', { date: formatDate(debt.date) }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <LoadingState />
      </View>
    );
  }

  if (isError || !data || !debt) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={CircleAlert} message={isError ? t('debtors.loadFailed') : t('debtors.pay.notFound')}>
          <Button variant="secondary" onPress={() => (isError ? refetch() : router.back())}>
            {isError ? t('sale.pay.retry') : t('common.back')}
          </Button>
        </EmptyState>
      </View>
    );
  }

  // Display only — the backend checks the amounts again.
  const due = debt.remaining;
  const entered = totalEntered(selected, amounts);
  const rest = due - entered;
  const change = rest < 0 ? -rest : 0;
  const cashIn = amountOf(selected, amounts, PaymentType.CASH);
  const progress = debt.total > 0 ? Math.min(100, Math.round(((debt.paid + Math.min(entered, due)) / debt.total) * 100)) : 0;

  let status: { text: string; tone: 'muted' | 'ok' | 'warn' | 'err' };
  let payLabel = t('debtors.pay.submitFull');
  let canPay = false;
  if (entered === 0) {
    status = { text: t('debtors.pay.statusEnter'), tone: 'muted' };
  } else if (rest > 0) {
    status = { text: t('debtors.pay.statusPartial', { amount: formatMoney(rest) }), tone: 'warn' };
    payLabel = t('debtors.pay.submitPartial', { amount: formatMoney(entered) });
    canPay = true;
  } else if (rest === 0) {
    status = { text: t('debtors.pay.statusFull'), tone: 'ok' };
    canPay = true;
  } else if (cashIn >= change) {
    status = { text: t('debtors.pay.statusChange', { amount: formatMoney(change) }), tone: 'ok' };
    payLabel = t('debtors.pay.submitChange', { amount: formatMoney(change) });
    canPay = true;
  } else {
    status = { text: t('debtors.pay.statusOverpay', { amount: formatMoney(change) }), tone: 'err' };
  }

  const pay = (cashboxId?: string) => {
    // Change is given from cash: send only what stays in the till.
    const payments = PAYMENT_METHODS.map((m) => ({
      type: m.type,
      amount: m.type === PaymentType.CASH ? amountOf(selected, amounts, m.type) - change : amountOf(selected, amounts, m.type),
    })).filter((p) => p.amount > 0);

    setError(null);
    repay.mutate(
      { kind, id, customerId: data.customer?.id ?? attachTo?.id, cashboxId, payments },
      {
        onSuccess: () => {
          toast.show(change > 0 ? t('debtors.pay.successChange', { amount: formatMoney(change) }) : t('debtors.pay.success'));
          router.back();
        },
        onError: (err) => setError(getApiErrorMessage(err, t('debtors.pay.failed'))),
      }
    );
  };

  const submit = () => {
    if (!canPay || repay.isPending) return;
    // Own open cashbox — the backend takes it; otherwise ask where the money goes.
    if (openCashboxes?.some((c) => c.isMine)) pay();
    else setPickerOpen(true);
  };

  const statusColor = { muted: 'text-muted', ok: 'text-ok-fg', warn: 'text-warn-fg', err: 'text-err-fg' }[status.tone];

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
      >
        {/* Hero: what is left of the debt */}
        <View className="bg-hero rounded-2xl p-[18px] gap-3">
          <View className="flex-row items-baseline justify-between gap-2">
            <Text className="font-onest text-sm text-hero-muted">{t('debtors.pay.remaining')}</Text>
            <Text className="font-onest text-[13px] text-hero-muted tabular-nums" numberOfLines={1}>
              {t('debtors.pay.debtTotal', {
                kind: kind === 'ORDER' ? t('debtors.order') : t('debtors.manual'),
                total: formatMoney(debt.total),
                paid: formatMoney(debt.paid),
              })}
            </Text>
          </View>
          <Money value={due} className="text-[32px] tracking-[-0.6px] text-hero-ink" currencyClassName="text-[15px] text-hero-muted" />
          <View className="h-2 rounded bg-hero-sub overflow-hidden">
            <View className="h-2 rounded bg-accent" style={{ width: `${progress}%` }} />
          </View>
          <View className="flex-row justify-between">
            <Text className="font-onest text-[13px] text-hero-muted">
              {t('debtors.pay.payingNow')} <Text className="font-onest-semibold text-hero-ink tabular-nums">{formatMoney(entered)}</Text>
            </Text>
            <Text className="font-onest text-[13px] text-hero-muted">
              {rest < 0 ? t('debtors.pay.change') : t('debtors.pay.willRemain')}{' '}
              <Text className={cn('font-onest-bold tabular-nums', rest > 0 ? 'text-hero-warn' : 'text-accent')}>
                {formatMoney(Math.abs(rest))}
              </Text>
            </Text>
          </View>
        </View>

        {/* Customer; an order without one may get it attached here */}
        <View className="flex-row items-center gap-3 bg-card rounded-lg py-3 pl-3.5 pr-3">
          <View
            className={cn(
              'w-11 h-11 rounded-full items-center justify-center',
              data.customer || attachTo ? 'bg-accent' : 'bg-sunken'
            )}
          >
            <UserRound size={20} color={data.customer || attachTo ? colors.onAccent : colors.muted} strokeWidth={2} />
          </View>
          <View className="flex-1 min-w-0 gap-0.5">
            <Text className="font-onest text-xs text-muted">{t('sale.customer.label')}</Text>
            <Text className="font-onest-semibold text-[15px] text-ink" numberOfLines={1}>
              {data.customer?.fullName ?? attachTo?.fullName ?? t('debtors.unassigned.title')}
            </Text>
          </View>
          {data.customer ? (
            <StatusBadge label={t('debtors.pay.debtor')} tone="err" />
          ) : attachTo ? (
            <IconButton icon={X} variant="sunken" accessibilityLabel={t('sale.customer.clear')} onPress={() => setAttachTo(null)} />
          ) : (
            <Button variant="primary" size="sm" icon={Plus} onPress={() => setCustomerOpen(true)}>
              {t('sale.customer.pick')}
            </Button>
          )}
        </View>

        <PaymentMethodsInput
          selected={selected}
          amounts={amounts}
          onSelectedChange={setSelected}
          onAmountsChange={setAmounts}
          due={due}
        />

        {/* Payment history */}
        <View className="bg-card rounded-3xl px-3.5 py-1.5">
          <Pressable
            onPress={() => setHistoryOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: historyOpen }}
            className="h-12 flex-row items-center justify-between"
          >
            <Text className="font-onest-bold text-[15px] text-ink">{t('debtors.pay.history', { count: debt.payments.length })}</Text>
            <View className="flex-row items-center gap-1.5">
              <Text className="font-onest-medium text-[13px] text-muted">
                {historyOpen ? t('debtors.pay.hide') : t('debtors.pay.show')}
              </Text>
              <ChevronDown
                size={18}
                color={colors.muted}
                strokeWidth={2}
                style={{ transform: [{ rotate: historyOpen ? '180deg' : '0deg' }] }}
              />
            </View>
          </Pressable>
          {historyOpen && (
            <>
              {debt.payments.map((p) => (
                <View key={p.id} className="flex-row items-center gap-3 py-2.5 border-t border-line">
                  <View className="w-9 h-9 rounded-full bg-ok-bg items-center justify-center">
                    <Plus size={16} color={colors.okFg} strokeWidth={2.4} />
                  </View>
                  <View className="flex-1 min-w-0 gap-0.5">
                    <Text className="font-onest-semibold text-sm text-ink">
                      {formatDate(p.createdAt)}, {formatTime(p.createdAt)}
                    </Text>
                    <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                      {[t(`sale.pay.method.${p.type}`), p.createdBy].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Text className="font-onest-bold text-sm text-ok-fg tabular-nums">+{formatMoney(p.amount)}</Text>
                </View>
              ))}
              <View className="flex-row justify-between pt-2.5 pb-2 border-t border-line">
                <Text className="font-onest text-[13px] text-muted">{t('debtors.pay.totalPaid')}</Text>
                <Text className="font-onest-bold text-[13px] text-ink tabular-nums">
                  {formatMoney(debt.paid)} {t('common.currency')}
                </Text>
              </View>
            </>
          )}
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
        <Button variant="accent" size="lg" full onPress={submit} disabled={!canPay || repay.isPending} loading={repay.isPending}>
          {payLabel}
        </Button>
      </View>

      <CustomerPickerSheet
        isOpen={customerOpen}
        selectedId={attachTo?.id}
        onClose={() => setCustomerOpen(false)}
        onSelect={(picked) => {
          setAttachTo(picked);
          setCustomerOpen(false);
        }}
      />

      <CashboxPickerSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(cashboxId) => {
          setPickerOpen(false);
          pay(cashboxId);
        }}
      />
    </KeyboardAvoidingView>
  );
}
