import { Button, HeroCard, IconButton, Segmented, StatusBadge, Text, toast } from '@/components/base';
import { CashboxPickerSheet } from '@/components/cashbox';
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
import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import { useOpenCashboxes } from '@/services/cashbox';
import { PaymentType } from '@/services/order/order.type';
import {
  CollateralType,
  RentalStatus,
  useAddRentalPayments,
  useRental,
  type RentalCollateralPayload,
} from '@/services/rental';
import { router } from 'expo-router';
import { ChevronLeft, CircleAlert, Plus, ShieldCheck, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDay, rentalBadges } from './rental-format';

const COLLATERAL_TYPES = [CollateralType.PASSPORT, CollateralType.GOLD, CollateralType.OTHER];

interface RentalPayScreenProps {
  rentalId: string;
  /** Opened right after creating the booking: «Бронь создана», «Позже» */
  created?: boolean;
}

/**
 * «Залог и предоплата» (design «Аренда · предоплата»): payments split by
 * methods and collaterals in one call (`POST /rental/:id/payments`). Money goes
 * to the employee's open cashbox; without one the cashbox picker opens. A
 * collateral alone needs no cashbox. The backend validates the amounts.
 */
export function RentalPayScreen({ rentalId, created = false }: RentalPayScreenProps) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { data: rental, isLoading, isError, refetch } = useRental(rentalId);
  const { data: openCashboxes } = useOpenCashboxes();
  const addPayments = useAddRentalPayments();

  const [selected, setSelected] = useState<PaymentType[]>([]);
  const [amounts, setAmounts] = useState<PaymentAmounts>(EMPTY_PAYMENT_AMOUNTS);
  const [kind, setKind] = useState<CollateralType>(CollateralType.PASSPORT);
  const [description, setDescription] = useState('');
  const [collaterals, setCollaterals] = useState<RentalCollateralPayload[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toCard = () => router.replace({ pathname: '/(tabs)/(rentals)/[id]', params: { id: rentalId } });
  const close = () => (created ? toCard() : router.back());

  const header = (title: string, subtitle?: React.ReactNode) => (
    <View className="flex-row items-start gap-2.5 px-4 pt-2 pb-3">
      {!created ? <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={close} /> : null}
      <View className="flex-1 min-w-0 gap-1">
        <Text className="type-heading text-ink" accessibilityRole="header" numberOfLines={2}>{title}</Text>
        {subtitle}
      </View>
      {created ? <IconButton icon={X} accessibilityLabel={t('common.close')} onPress={close} /> : null}
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header(t('rental.pay.title'))}
        <LoadingState />
      </View>
    );
  }

  if (isError || !rental) {
    return (
      <View className="flex-1 bg-bg">
        {header(t('rental.pay.title'))}
        <EmptyState icon={CircleAlert} message={t('rental.card.loadFailed')}>
          <Button variant="primary" onPress={() => void refetch()}>{t('rental.list.retry')}</Button>
        </EmptyState>
      </View>
    );
  }

  if (rental.status === RentalStatus.CANCELLED) {
    return (
      <View className="flex-1 bg-bg">
        {header(t('rental.pay.title'))}
        <EmptyState icon={CircleAlert} message={t('rental.pay.cancelled')}>
          <Button variant="secondary" onPress={close}>{t('common.back')}</Button>
        </EmptyState>
      </View>
    );
  }

  // Display only — the backend checks the amounts again
  const due = Math.max(Number(rental.order.dueAmount), 0);
  const entered = totalEntered(selected, amounts);
  const rest = due - entered;
  const change = rest < 0 ? -rest : 0;
  const cashIn = amountOf(selected, amounts, PaymentType.CASH);
  const overpaid = change > 0 && cashIn < change;

  const draft = description.trim();
  const allCollaterals = draft ? [...collaterals, { type: kind, description: draft }] : collaterals;
  const canSubmit = !addPayments.isPending && !overpaid && (entered > 0 || allCollaterals.length > 0);

  let hint: string | null = null;
  if (overpaid) hint = t('rental.pay.overpaid', { amount: formatMoney(change) });
  else if (!canSubmit && !addPayments.isPending) hint = t('rental.pay.hintEmpty');
  else if (change > 0) hint = t('rental.pay.change', { amount: formatMoney(change) });
  else if (entered > 0) hint = t('rental.pay.willRemain', { amount: formatMoney(rest) });

  const label =
    entered > 0
      ? t('rental.pay.submitAmount', { amount: formatMoney(Math.min(entered, due)) })
      : allCollaterals.length > 0
        ? t('rental.pay.submitCollateral')
        : t('rental.pay.submit');

  const send = (cashboxId?: string) => {
    // Change is given from cash: send only what stays in the till
    const payments = PAYMENT_METHODS.map((m) => ({
      type: m.type,
      amount: m.type === PaymentType.CASH ? amountOf(selected, amounts, m.type) - change : amountOf(selected, amounts, m.type),
    })).filter((p) => p.amount > 0);
    setError(null);
    addPayments.mutate(
      {
        id: rental.id,
        body: {
          payments: payments.length ? payments : undefined,
          collaterals: allCollaterals.length ? allCollaterals : undefined,
          cashboxId,
        },
      },
      {
        onSuccess: () => {
          toast.show(
            change > 0 ? t('rental.pay.successChange', { amount: formatMoney(change) }) : t('rental.pay.success'),
            'success',
          );
          close();
        },
        onError: (err) => setError(getApiErrorMessage(err, t('rental.pay.failed'))),
      },
    );
  };

  const submit = () => {
    if (!canSubmit) return;
    // Money needs a cashbox: the own open one (the backend takes it) or a chosen one
    if (entered > 0 && !openCashboxes?.some((c) => c.isMine)) setPickerOpen(true);
    else send();
  };

  const addCollateral = () => {
    if (!draft) return;
    setCollaterals((current) => [...current, { type: kind, description: draft }]);
    setDescription('');
  };

  const customerName = rental.order.customer?.user.fullName ?? t('rental.noCustomer');

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header(
        created ? t('rental.pay.createdTitle', { code: rental.code }) : t('rental.pay.title'),
        <View className="flex-row flex-wrap items-center gap-1.5">
          {rentalBadges(rental, t).map((badge) => (
            <StatusBadge key={badge.label} label={badge.label} tone={badge.tone} />
          ))}
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {customerName} · {formatDay(rental.startDate, i18n.language)} – {formatDay(rental.endDate, i18n.language)}
          </Text>
        </View>,
      )}

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
      >
        <HeroCard
          label={t('rental.card.total')}
          amount={rental.order.totalAmount}
          currency={t('common.currency')}
          tiles={[
            { label: t('rental.pay.paid'), value: rental.order.paidAmount, tone: 'accent' },
            { label: t('rental.card.left'), value: due, tone: due > 0 ? 'warn' : 'default' },
          ]}
        />

        {due > 0 ? (
          <View className="gap-1.5">
            <PaymentMethodsInput
              selected={selected}
              amounts={amounts}
              onSelectedChange={setSelected}
              onAmountsChange={setAmounts}
              due={due}
            />
            <Text className="font-onest text-xs text-muted px-1">{t('rental.pay.prepayNote')}</Text>
          </View>
        ) : (
          <View className="bg-ok-bg rounded-lg px-4 py-3">
            <Text className="font-onest-semibold text-sm text-ok-fg">{t('rental.pay.allPaid')}</Text>
          </View>
        )}

        {/* Collateral */}
        <View className="bg-card rounded-xl p-3.5 gap-3">
          <View className="flex-row items-baseline justify-between px-0.5">
            <Text className="font-onest-bold text-[15px] text-ink">{t('rental.collateral.title')}</Text>
            <Text className="font-onest text-xs text-muted">{t('rental.pay.optional')}</Text>
          </View>
          {rental.collaterals
            .filter((c) => !c.returnedAt)
            .map((c) => (
              <CollateralRow
                key={c.id}
                text={t('rental.collateral.held', { what: `${t(`rental.collateralType.${c.type}`)} ${c.description}` })}
              />
            ))}
          {collaterals.map((c, i) => (
            <CollateralRow
              key={`new-${i}`}
              text={`${t(`rental.collateralType.${c.type}`)} ${c.description}`}
              onRemove={() => setCollaterals((current) => current.filter((_, j) => j !== i))}
              removeLabel={t('rental.pay.removeCollateral')}
            />
          ))}
          <Segmented<CollateralType>
            options={COLLATERAL_TYPES.map((type) => ({ value: type, label: t(`rental.pay.kind.${type}`) }))}
            value={kind}
            onChange={setKind}
          />
          <View className="gap-1.5">
            <Text className="font-onest-semibold text-[13px] text-soft">{t(`rental.pay.field.${kind}`)}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t(`rental.pay.placeholder.${kind}`)}
              placeholderTextColor={colors.muted}
              autoCapitalize={kind === CollateralType.PASSPORT ? 'characters' : 'sentences'}
              className="h-[52px] px-4 rounded-2xl bg-sunken font-onest text-base text-ink"
            />
          </View>
          <Button variant="secondary" size="sm" icon={Plus} disabled={!draft} onPress={addCollateral} className="self-start">
            {t('rental.pay.addCollateral')}
          </Button>
          <Text className="font-onest text-xs text-muted">{t('rental.pay.collateralNote')}</Text>
        </View>

        {error ? (
          <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="px-4 pt-2 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
        {hint ? (
          <Text className={cn('font-onest text-[13px] text-center', overpaid ? 'text-err-fg' : 'text-muted')}>{hint}</Text>
        ) : null}
        <Button variant="accent" size="lg" full disabled={!canSubmit} loading={addPayments.isPending} onPress={submit}>
          {label}
        </Button>
        {created ? (
          <Button variant="ghost" full onPress={toCard}>
            {t('rental.pay.later')}
          </Button>
        ) : null}
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

function CollateralRow({ text, onRemove, removeLabel }: { text: string; onRemove?: () => void; removeLabel?: string }) {
  const colors = useTheme();
  return (
    <View className="flex-row items-center gap-3 p-2.5 rounded-md bg-sunken">
      <View className="w-9 h-9 rounded-sm bg-warn-bg items-center justify-center">
        <ShieldCheck size={18} color={colors.warnFg} strokeWidth={2} />
      </View>
      <Text className="flex-1 font-onest-semibold text-sm text-ink">{text}</Text>
      {onRemove ? (
        <IconButton icon={X} size="sm" variant="card" accessibilityLabel={removeLabel ?? ''} onPress={onRemove} />
      ) : null}
    </View>
  );
}
