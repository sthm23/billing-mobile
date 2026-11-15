import { Button, HeroCard, IconButton, Segmented, StatusBadge, Switch, Text, toast } from '@/components/base';
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
  useIssueRental,
  useRental,
  type RentalCollateralPayload,
  type RentalDetail,
} from '@/services/rental';
import { router } from 'expo-router';
import { Check, ChevronLeft, CircleAlert, Plus, ShieldCheck, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDay, itemAttributes, rentalBadges } from './rental-format';

const COLLATERAL_TYPES = [CollateralType.PASSPORT, CollateralType.GOLD, CollateralType.OTHER];

interface RentalPayScreenProps {
  rentalId: string;
  /**
   * `pay` — «Залог и предоплата» (`POST /rental/:id/payments`);
   * `issue` — «Выдача» (`POST /rental/:id/issue`): the same money and
   * collateral plus a check of the items handed over.
   */
  mode?: 'pay' | 'issue';
  /** Opened right after creating the booking: «Бронь создана», «Позже» */
  created?: boolean;
}

/**
 * Payments split by methods and collaterals in one call (designs «Аренда ·
 * предоплата» and «Аренда · выдача»). Money goes to the employee's open
 * cashbox; without one the cashbox picker opens. A collateral alone needs no
 * cashbox. The backend validates the amounts, the dates and the stock.
 */
export function RentalPayScreen({ rentalId, mode = 'pay', created = false }: RentalPayScreenProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const issue = mode === 'issue';
  const { data: rental, isLoading, isError, refetch } = useRental(rentalId);
  const { data: openCashboxes } = useOpenCashboxes();
  const addPayments = useAddRentalPayments();
  const issueRental = useIssueRental();
  const pending = addPayments.isPending || issueRental.isPending;

  const [selected, setSelected] = useState<PaymentType[]>([]);
  const [amounts, setAmounts] = useState<PaymentAmounts>(EMPTY_PAYMENT_AMOUNTS);
  const [kind, setKind] = useState<CollateralType>(CollateralType.PASSPORT);
  const [description, setDescription] = useState('');
  const [collaterals, setCollaterals] = useState<RentalCollateralPayload[]>([]);
  /** Issue: lines not ticked yet (all are ticked at start) */
  const [unchecked, setUnchecked] = useState<string[]>([]);
  /** Issue: handing over without any collateral, confirmed by the seller */
  const [noDeposit, setNoDeposit] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toCard = () => router.replace({ pathname: '/(tabs)/(rentals)/[id]', params: { id: rentalId } });
  const close = () => (created ? toCard() : router.back());
  const title = issue ? t('rental.issue.title') : t('rental.pay.title');

  const header = (text: string, subtitle?: React.ReactNode) => (
    <View className="flex-row items-start gap-2.5 px-4 pt-2 pb-3">
      {!created ? <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={close} /> : null}
      <View className="flex-1 min-w-0 gap-1">
        <Text className="type-heading text-ink" accessibilityRole="header" numberOfLines={2}>{text}</Text>
        {subtitle}
      </View>
      {created ? <IconButton icon={X} accessibilityLabel={t('common.close')} onPress={close} /> : null}
    </View>
  );

  const stub = (message: string) => (
    <View className="flex-1 bg-bg">
      {header(title)}
      <EmptyState icon={CircleAlert} message={message}>
        <Button variant="secondary" onPress={close}>{t('common.back')}</Button>
      </EmptyState>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header(title)}
        <LoadingState />
      </View>
    );
  }

  if (isError || !rental) {
    return (
      <View className="flex-1 bg-bg">
        {header(title)}
        <EmptyState icon={CircleAlert} message={t('rental.card.loadFailed')}>
          <Button variant="primary" onPress={() => void refetch()}>{t('rental.list.retry')}</Button>
        </EmptyState>
      </View>
    );
  }

  if (rental.status === RentalStatus.CANCELLED) return stub(t('rental.pay.cancelled'));
  // Issue is for a booking only; the mutation stores the issued rental, so
  // this also shows for a moment after a successful issue — `close` runs then
  if (issue && rental.status !== RentalStatus.BOOKED) return stub(t('rental.issue.notBooked'));

  // Display only — the backend checks the amounts again
  const due = Math.max(Number(rental.order.dueAmount), 0);
  const entered = totalEntered(selected, amounts);
  const rest = due - entered;
  const change = rest < 0 ? -rest : 0;
  const cashIn = amountOf(selected, amounts, PaymentType.CASH);
  const overpaid = change > 0 && cashIn < change;

  const held = rental.collaterals.filter((c) => !c.returnedAt);
  const draft = description.trim();
  const allCollaterals = draft ? [...collaterals, { type: kind, description: draft }] : collaterals;
  const allChecked = unchecked.length === 0;
  const hasCollateral = held.length > 0 || allCollaterals.length > 0;
  const takeCollateral = !issue || (held.length === 0 && !noDeposit);

  const canSubmit = issue
    ? !pending && !overpaid && allChecked && (hasCollateral || noDeposit)
    : !pending && !overpaid && (entered > 0 || allCollaterals.length > 0);

  let hint: string | null = null;
  if (overpaid) hint = t('rental.pay.overpaid', { amount: formatMoney(change) });
  else if (issue && !allChecked) hint = t('rental.issue.checkAll');
  else if (issue && !hasCollateral && !noDeposit) hint = t('rental.issue.needCollateral');
  else if (!issue && !canSubmit && !pending) hint = t('rental.pay.hintEmpty');
  else if (change > 0) hint = t('rental.pay.change', { amount: formatMoney(change) });
  else if (entered > 0) hint = t('rental.pay.willRemain', { amount: formatMoney(rest) });

  const label = issue
    ? t('rental.issue.submit')
    : entered > 0
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
    const body = {
      payments: payments.length ? payments : undefined,
      collaterals: takeCollateral && allCollaterals.length ? allCollaterals : undefined,
      cashboxId,
    };
    const onSuccess = () => {
      const done = issue ? t('rental.issue.success') : t('rental.pay.success');
      toast.show(change > 0 ? t('rental.pay.withChange', { text: done, amount: formatMoney(change) }) : done, 'success');
      close();
    };
    const onError = (err: unknown) =>
      setError(getApiErrorMessage(err, issue ? t('rental.issue.failed') : t('rental.pay.failed')));
    setError(null);
    if (issue) issueRental.mutate({ id: rental.id, body }, { onSuccess, onError });
    else addPayments.mutate({ id: rental.id, body }, { onSuccess, onError });
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
  const units = rental.order.items.reduce((sum, item) => sum + item.quantity, 0);
  const checkedUnits = rental.order.items.reduce((sum, item) => sum + (unchecked.includes(item.id) ? 0 : item.quantity), 0);

  const heldRows = held.map((c) => (
    <CollateralRow
      key={c.id}
      text={t('rental.collateral.held', { what: `${t(`rental.collateralType.${c.type}`)} ${c.description}` })}
    />
  ));

  const collateralInputs = (
    <>
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
    </>
  );

  // Issue with a collateral held: just show it. Issue without one: take it
  // or confirm «Без залога». Payment: held ones + optional new ones.
  const collateralBlock = (
    <CollateralBlock
      title={t('rental.collateral.title')}
      aside={
        !issue ? (
          <Text className="font-onest text-xs text-muted">{t('rental.pay.optional')}</Text>
        ) : held.length === 0 ? (
          <View className="flex-row items-center gap-2">
            <Text className="font-onest-semibold text-[13px] text-soft">{t('rental.issue.noDeposit')}</Text>
            <Switch value={noDeposit} onValueChange={setNoDeposit} accessibilityLabel={t('rental.issue.noDeposit')} />
          </View>
        ) : null
      }
    >
      {heldRows}
      {takeCollateral ? collateralInputs : null}
      {issue && held.length === 0 && noDeposit ? (
        <View className="bg-warn-bg rounded-md px-3.5 py-3">
          <Text className="font-onest-semibold text-[13px] leading-[18px] text-warn-fg">{t('rental.issue.noDepositNote')}</Text>
        </View>
      ) : null}
    </CollateralBlock>
  );

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header(
        created ? t('rental.pay.createdTitle', { code: rental.code }) : title,
        <View className="flex-row flex-wrap items-center gap-1.5">
          {issue ? null : rentalBadges(rental, t).map((badge) => (
            <StatusBadge key={badge.label} label={badge.label} tone={badge.tone} />
          ))}
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {issue
              ? t('rental.issue.subtitle', { code: rental.code, name: customerName })
              : `${customerName} · ${formatDay(rental.startDate, lang)} – ${formatDay(rental.endDate, lang)}`}
          </Text>
        </View>,
      )}

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
      >
        {issue ? (
          <HeroCard
            label={t('rental.issue.leftToPay')}
            chip={t('rental.issue.ofTotal', { amount: formatMoney(rental.order.totalAmount) })}
            amount={due}
            currency={t('common.currency')}
          >
            <View className="flex-row flex-wrap gap-2">
              <View className="rounded-pill bg-hero-sub px-3 py-1.5">
                <Text className="font-onest-semibold text-xs text-hero-ink">
                  {t('rental.issue.units', { checked: checkedUnits, total: units })}
                </Text>
              </View>
              <View className="rounded-pill bg-hero-sub px-3 py-1.5">
                <Text className="font-onest-semibold text-xs text-hero-ink">
                  {t('rental.issue.returnBy', { date: formatDay(rental.endDate, lang) })}
                </Text>
              </View>
            </View>
          </HeroCard>
        ) : (
          <HeroCard
            label={t('rental.card.total')}
            amount={rental.order.totalAmount}
            currency={t('common.currency')}
            tiles={[
              { label: t('rental.pay.paid'), value: rental.order.paidAmount, tone: 'accent' },
              { label: t('rental.card.left'), value: due, tone: due > 0 ? 'warn' : 'default' },
            ]}
          />
        )}

        {issue ? (
          <ItemsCheck
            rental={rental}
            unchecked={unchecked}
            onToggle={(id) =>
              setUnchecked((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))
            }
          />
        ) : null}

        {issue ? collateralBlock : null}

        {issue ? (
          <View className="flex-row items-baseline justify-between px-1 pt-1">
            <Text className="font-onest-bold text-[15px] text-ink">{t('rental.issue.extraPayment')}</Text>
            <Text className="font-onest text-xs text-muted">{t('rental.pay.optional')}</Text>
          </View>
        ) : null}

        {due > 0 ? (
          <View className="gap-1.5">
            <PaymentMethodsInput
              selected={selected}
              amounts={amounts}
              onSelectedChange={setSelected}
              onAmountsChange={setAmounts}
              due={due}
            />
            {!issue ? <Text className="font-onest text-xs text-muted px-1">{t('rental.pay.prepayNote')}</Text> : null}
          </View>
        ) : (
          <View className="bg-ok-bg rounded-lg px-4 py-3">
            <Text className="font-onest-semibold text-sm text-ok-fg">{t('rental.pay.allPaid')}</Text>
          </View>
        )}

        {!issue ? collateralBlock : null}

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
        <Button variant="accent" size="lg" full disabled={!canSubmit} loading={pending} onPress={submit}>
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

/** Issue: the seller ticks each line together with the customer; all lines are issued */
function ItemsCheck({
  rental,
  unchecked,
  onToggle,
}: {
  rental: RentalDetail;
  unchecked: string[];
  onToggle: (id: string) => void;
}) {
  const { t } = useTranslation();
  const colors = useTheme();
  return (
    <View className="bg-card rounded-xl p-3.5 gap-2">
      <View className="flex-row items-baseline justify-between px-0.5 pb-1">
        <Text className="font-onest-bold text-[15px] text-ink">{t('rental.issue.items')}</Text>
        <Text className="font-onest text-xs text-muted">{t('rental.issue.checkTogether')}</Text>
      </View>
      {rental.order.items.map((item) => {
        const on = !unchecked.includes(item.id);
        const meta = [itemAttributes(item), item.quantity > 1 ? `× ${item.quantity}` : null].filter(Boolean).join(' · ');
        return (
          <Pressable
            key={item.id}
            onPress={() => onToggle(item.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            className="flex-row items-center gap-3 p-3 rounded-lg bg-sunken"
          >
            <View className="flex-1 min-w-0 gap-0.5">
              <Text className="type-body-strong text-ink" numberOfLines={2}>{item.variant.product.name}</Text>
              <Text className="font-onest text-xs text-muted" numberOfLines={1}>{meta}</Text>
            </View>
            <View
              className={cn(
                'w-7 h-7 rounded-sm items-center justify-center',
                on ? 'bg-accent' : 'border-[1.5px] border-muted',
              )}
            >
              {on ? <Check size={18} color={colors.onAccent} strokeWidth={2.5} /> : null}
            </View>
          </Pressable>
        );
      })}
      {unchecked.length > 0 ? (
        <Text className="font-onest text-xs text-muted px-0.5">{t('rental.issue.allIssued')}</Text>
      ) : null}
    </View>
  );
}

function CollateralBlock({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="bg-card rounded-xl p-3.5 gap-3">
      <View className="flex-row items-center justify-between gap-2 px-0.5">
        <Text className="font-onest-bold text-[15px] text-ink">{title}</Text>
        {aside}
      </View>
      {children}
    </View>
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
