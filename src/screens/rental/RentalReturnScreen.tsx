import { Button, Chip, IconButton, Stepper, StatusBadge, Switch, Text, toast } from '@/components/base';
import { CashboxPickerSheet } from '@/components/cashbox';
import { EmptyState, LoadingState } from '@/components/common';
import {
  EMPTY_PAYMENT_AMOUNTS,
  PAYMENT_METHODS,
  PaymentMethodsInput,
  amountOf,
  digitsOf,
  totalEntered,
  type PaymentAmounts,
} from '@/components/order';
import { useDebounce } from '@/hooks/use-debounce';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { canLowerPrice } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import { useOpenCashboxes } from '@/services/cashbox';
import { PaymentType } from '@/services/order/order.type';
import {
  RentalStatus,
  useCleaningConflicts,
  useCreateRentalReturn,
  useRental,
  useRentalReturnPreview,
  type RentalDetail,
  type RentalReturnLinePayload,
  type RentalReturnPayload,
} from '@/services/rental';
import { router } from 'expo-router';
import { Check, ChevronDown, ChevronLeft, CircleAlert, TriangleAlert } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDay, formatDayTime, formatLocalDate, itemAttributes, OUT_STATUSES } from './rental-format';

/** Max dry cleaning a seller may set (backend MAX_CLEANING_DAYS) */
const MAX_CLEANING_DAYS = 30;

interface ReturnLine {
  orderItemId: string;
  on: boolean;
  quantity: number;
  /** 0 — no dry cleaning */
  cleaningDays: number;
  /** Days used when the cleaning switch is turned on */
  lastCleaningDays: number;
}

interface RentalReturnScreenProps {
  rentalId: string;
}

/**
 * «Приём возврата» (design «Аренда · возврат», variants full / partial / early /
 * seller). Return moment is now. Every number — days, penalty hint, unused days,
 * new total, due and money back — comes from `POST /rental/:id/returns/preview`,
 * recomputed as the inputs change; dry-cleaning conflicts are a warning only.
 */
export function RentalReturnScreen({ rentalId }: RentalReturnScreenProps) {
  const { t } = useTranslation();
  const { data: rental, isLoading, isError, refetch } = useRental(rentalId);

  const header = (
    <View className="flex-row items-start gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <Text className="flex-1 type-heading text-ink" accessibilityRole="header">{t('rental.return.title')}</Text>
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
  if (isError || !rental) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={CircleAlert} message={t('rental.card.loadFailed')}>
          <Button variant="primary" onPress={() => void refetch()}>{t('rental.list.retry')}</Button>
        </EmptyState>
      </View>
    );
  }
  // The mutation stores the returned rental: a closed one shows this for a moment before going back
  if (!OUT_STATUSES.includes(rental.status)) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={CircleAlert} message={t('rental.return.notOut')}>
          <Button variant="secondary" onPress={() => router.back()}>{t('common.back')}</Button>
        </EmptyState>
      </View>
    );
  }
  return <ReturnForm rental={rental} />;
}

function ReturnForm({ rental }: { rental: RentalDetail }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const canManage = canLowerPrice(user);
  const { data: openCashboxes } = useOpenCashboxes();
  const createReturn = useCreateRentalReturn();

  const outstanding = useMemo(
    () => rental.order.items.filter((item) => item.quantity > item.returnedQuantity),
    [rental.order.items],
  );

  const [lines, setLines] = useState<ReturnLine[]>(() =>
    outstanding.map((item) => ({
      orderItemId: item.id,
      on: true,
      quantity: item.quantity - item.returnedQuantity,
      cleaningDays: item.variant.defaultCleaningDays,
      lastCleaningDays: Math.max(item.variant.defaultCleaningDays, 1),
    })),
  );
  const [penaltyOpen, setPenaltyOpen] = useState(false);
  const [penalty, setPenalty] = useState('');
  const [penaltyComment, setPenaltyComment] = useState('');
  /** The seller changed the penalty: the overdue hint no longer prefills it */
  const [penaltyTouched, setPenaltyTouched] = useState(false);
  const [refund, setRefund] = useState('');
  const [refundMethod, setRefundMethod] = useState<PaymentType | null>(null);
  const [selected, setSelected] = useState<PaymentType[]>([]);
  const [amounts, setAmounts] = useState<PaymentAmounts>(EMPTY_PAYMENT_AMOUNTS);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const penaltyValue = digitsOf(penalty);
  const penaltyMissingReason = penaltyValue > 0 && !penaltyComment.trim();
  const refundValue = canManage ? digitsOf(refund) : 0;

  const items: RentalReturnLinePayload[] = lines
    .filter((line) => line.on && line.quantity > 0)
    .map((line) => ({ orderItemId: line.orderItemId, quantity: line.quantity, cleaningDays: line.cleaningDays }));

  // Without a reason the backend rejects the penalty: no preview until it is given
  const previewBody: RentalReturnPayload | null =
    items.length === 0 || penaltyMissingReason
      ? null
      : {
          items,
          ...(penaltyValue > 0 ? { penaltyAmount: penaltyValue, penaltyComment: penaltyComment.trim() } : {}),
          ...(refundValue > 0 ? { earlyReturnRefund: refundValue } : {}),
        };
  // Debounced by a string key: the objects are new on every render
  const bodyKey = previewBody ? JSON.stringify(previewBody) : '';
  const debouncedKey = useDebounce(bodyKey, 400);
  const debouncedBody = useMemo(
    () => (debouncedKey ? (JSON.parse(debouncedKey) as RentalReturnPayload) : null),
    [debouncedKey],
  );
  const cleanedKey = JSON.stringify(items.filter((line) => line.cleaningDays > 0));
  const debouncedCleanedKey = useDebounce(cleanedKey, 400);
  const cleanedLines = useMemo(
    () => JSON.parse(debouncedCleanedKey) as RentalReturnLinePayload[],
    [debouncedCleanedKey],
  );
  const preview = useRentalReturnPreview(rental.id, debouncedBody);
  const conflicts = useCleaningConflicts(rental.id, cleanedLines);

  const p = preview.data;
  // Numbers match the inputs on screen (an error keeps the last data — not fresh)
  const fresh =
    !!p && !preview.isPlaceholderData && !preview.isFetching && !preview.isError && debouncedKey === bodyKey;

  // Overdue: prefill the manual penalty with the backend's hint (R4) once
  useEffect(() => {
    if (!p || penaltyTouched || p.overdueDays <= 0 || penalty !== '') return;
    const suggested = Number(p.suggestedPenalty);
    if (suggested <= 0) return;
    setPenalty(formatMoney(suggested));
    setPenaltyComment(t('rental.return.overdueComment', { count: p.overdueDays }));
    setPenaltyOpen(true);
  }, [p, penaltyTouched, penalty, t]);

  const due = p ? Math.max(Number(p.dueAmount), 0) : 0;
  const cashOut = p ? Number(p.cashOutAmount) : 0;
  const maxRefund = p ? Number(p.maxEarlyReturnRefund) : 0;
  const refundTooBig = refundValue > 0 && p !== undefined && refundValue > maxRefund;

  const entered = due > 0 ? totalEntered(selected, amounts) : 0;
  const rest = due - entered;
  const change = rest < 0 ? -rest : 0;
  const cashIn = amountOf(selected, amounts, PaymentType.CASH);
  const overpaid = change > 0 && cashIn < change;

  const totalUnits = outstanding.reduce((sum, item) => sum + item.quantity - item.returnedQuantity, 0);
  const backUnits = items.reduce((sum, line) => sum + line.quantity, 0);
  const partial = backUnits < totalUnits;

  const canSubmit =
    fresh &&
    !createReturn.isPending &&
    items.length > 0 &&
    !penaltyMissingReason &&
    !refundTooBig &&
    !overpaid &&
    !(cashOut > 0 && !refundMethod);

  let hint: string | null = null;
  if (items.length === 0) hint = t('rental.return.pickItems');
  else if (penaltyMissingReason) hint = t('rental.return.penaltyReasonRequired');
  else if (refundTooBig) hint = t('rental.return.refundTooBig', { amount: formatMoney(maxRefund) });
  else if (preview.isError && !preview.isFetching)
    hint = getApiErrorMessage(preview.error, t('rental.return.previewFailed'));
  else if (overpaid) hint = t('rental.pay.overpaid', { amount: formatMoney(change) });
  else if (cashOut > 0 && !refundMethod) hint = t('rental.return.pickRefundMethod');
  else if (change > 0) hint = t('rental.pay.change', { amount: formatMoney(change) });
  else if (p && rest > 0 && fresh)
    hint =
      p.rentalStatusAfter === RentalStatus.RETURNED
        ? t('rental.return.becomesDebt', { amount: formatMoney(rest) })
        : t('rental.return.payLater', { amount: formatMoney(rest) });

  const label = partial
    ? t('rental.return.submitPartial', { back: backUnits, total: totalUnits })
    : cashOut > 0
      ? t('rental.return.submitCashOut', { amount: formatMoney(cashOut) })
      : t('rental.return.submit');

  const send = (cashboxId?: string) => {
    if (!previewBody) return;
    const payments = PAYMENT_METHODS.map((m) => ({
      type: m.type,
      amount: m.type === PaymentType.CASH ? amountOf(selected, amounts, m.type) - change : amountOf(selected, amounts, m.type),
    })).filter((x) => x.amount > 0);
    setError(null);
    createReturn.mutate(
      {
        id: rental.id,
        body: {
          ...previewBody,
          ...(due > 0 && payments.length ? { payments } : {}),
          ...(cashOut > 0 && refundMethod ? { refundPaymentType: refundMethod } : {}),
          cashboxId,
        },
      },
      {
        onSuccess: () => {
          toast.show(
            partial ? t('rental.return.successPartial', { back: backUnits, total: totalUnits }) : t('rental.return.success'),
            'success',
          );
          router.back();
        },
        onError: (err) => setError(getApiErrorMessage(err, t('rental.return.failed'))),
      },
    );
  };

  const submit = () => {
    if (!canSubmit) return;
    // Money in or out needs a cashbox: the own open one (the backend takes it) or a chosen one
    const moneyMoves = (due > 0 && entered > 0) || cashOut > 0;
    if (moneyMoves && !openCashboxes?.some((c) => c.isMine)) setPickerOpen(true);
    else send();
  };

  const update = (orderItemId: string, patch: Partial<ReturnLine>) =>
    setLines((current) => current.map((line) => (line.orderItemId === orderItemId ? { ...line, ...patch } : line)));

  const customerName = rental.order.customer?.user.fullName ?? t('rental.noCustomer');
  const planned = p?.items[0]?.plannedDays;
  const actual = p ? Math.max(...p.items.map((i) => i.actualDays), 0) : undefined;
  const conflictRows = (conflicts.data ?? []).flatMap((c) =>
    c.conflicts.map((x) => ({ ...x, orderItemId: c.orderItemId, availableFrom: c.availableFrom })),
  );
  const nameOf = (orderItemId: string) =>
    rental.order.items.find((item) => item.id === orderItemId)?.variant.product.name ?? '';

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex-row items-start gap-2.5 px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        <View className="flex-1 min-w-0 gap-1">
          <Text className="type-heading text-ink" accessibilityRole="header">{t('rental.return.title')}</Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {t('rental.issue.subtitle', { code: rental.code, name: customerName })}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
      >
        {/* What came back */}
        <View className="bg-card rounded-xl p-3.5 gap-2">
          <View className="flex-row items-baseline justify-between px-0.5 pb-1">
            <Text className="font-onest-bold text-[15px] text-ink">{t('rental.return.whatBack')}</Text>
            <Text className={cn('font-onest-semibold text-xs', partial ? 'text-warn-fg' : 'text-ok-fg')}>
              {t('rental.return.backCount', { back: backUnits, total: totalUnits })}
            </Text>
          </View>
          {outstanding.map((item) => {
            const line = lines.find((l) => l.orderItemId === item.id);
            if (!line) return null;
            const left = item.quantity - item.returnedQuantity;
            const freeFrom = p?.items.find((i) => i.orderItemId === item.id)?.availableFrom;
            const cleaning = line.cleaningDays > 0;
            return (
              <View key={item.id} className={cn('rounded-lg bg-sunken p-3 gap-3', !line.on && 'opacity-60')}>
                <Pressable
                  onPress={() => update(item.id, { on: !line.on })}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: line.on }}
                  className="flex-row items-center gap-3"
                >
                  <View
                    className={cn(
                      'w-7 h-7 rounded-sm items-center justify-center',
                      line.on ? 'bg-accent' : 'border-[1.5px] border-muted',
                    )}
                  >
                    {line.on ? <Check size={18} color={colors.onAccent} strokeWidth={2.5} /> : null}
                  </View>
                  <View className="flex-1 min-w-0 gap-0.5">
                    <Text className="type-body-strong text-ink" numberOfLines={2}>{item.variant.product.name}</Text>
                    <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                      {[itemAttributes(item), t('rental.return.pieces', { count: left })].join(' · ')}
                    </Text>
                  </View>
                </Pressable>

                {line.on && left > 1 ? (
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="font-onest-semibold text-[13px] text-soft">{t('rental.return.howMany')}</Text>
                    <View className="flex-row items-center gap-2">
                      <Stepper value={line.quantity} onChange={(quantity) => update(item.id, { quantity })} min={1} max={left} size="sm" />
                      <Text className="font-onest text-xs text-muted">{t('rental.return.of', { total: left })}</Text>
                    </View>
                  </View>
                ) : null}

                {line.on ? (
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 min-w-0 gap-0.5">
                      <Text className="font-onest-semibold text-[13px] text-ink">{t('rental.return.cleaning')}</Text>
                      <Text className={cn('font-onest text-xs', cleaning ? 'text-warn-fg' : 'text-muted')}>
                        {cleaning
                          ? freeFrom && fresh
                            ? t('rental.return.freeFrom', { date: formatDayTime(freeFrom, lang) })
                            : t('rental.return.cleaningDays', { count: line.cleaningDays })
                          : t('rental.return.freeNow')}
                      </Text>
                    </View>
                    {cleaning ? (
                      <Stepper
                        value={line.cleaningDays}
                        onChange={(days) => update(item.id, { cleaningDays: days, lastCleaningDays: days })}
                        min={1}
                        max={MAX_CLEANING_DAYS}
                        size="sm"
                      />
                    ) : null}
                    <Switch
                      value={cleaning}
                      onValueChange={(on) => update(item.id, { cleaningDays: on ? line.lastCleaningDays : 0 })}
                      accessibilityLabel={t('rental.return.cleaning')}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Dry cleaning overlaps a booking — a warning, the return can still be taken */}
        {conflictRows.length > 0 ? (
          <View className="bg-warn-bg rounded-xl p-3.5 gap-2.5" accessibilityRole="alert">
            <View className="flex-row items-center gap-2">
              <TriangleAlert size={18} color={colors.warnFg} strokeWidth={2} />
              <Text className="flex-1 font-onest-bold text-sm text-warn-fg">{t('rental.return.conflictTitle')}</Text>
            </View>
            {conflictRows.map((row) => (
              <View key={`${row.orderItemId}-${row.rentalId}`} className="bg-card rounded-md px-3 py-2.5 gap-0.5">
                <Text className="font-onest-semibold text-[13px] text-ink">
                  {t('rental.return.conflictLine', {
                    name: nameOf(row.orderItemId),
                    date: formatLocalDate(row.startDate, lang),
                  })}
                </Text>
                <Text className="font-onest text-xs text-muted">
                  {t('rental.return.conflictFree', {
                    customer: row.customerName ?? t('rental.noCustomer'),
                    free: row.availableAtStart,
                    need: row.quantity,
                  })}
                </Text>
              </View>
            ))}
            <Text className="font-onest text-xs leading-[17px] text-warn-fg">{t('rental.return.conflictNote')}</Text>
          </View>
        ) : null}

        {/* Plan vs fact (hint only) */}
        <View className="bg-card rounded-xl p-3.5 gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-onest-semibold text-sm text-ink">
              {t('rental.return.plan', { days: planned !== undefined ? t('rental.days', { count: planned }) : '…' })}
            </Text>
            <Text className="font-onest text-sm text-muted">·</Text>
            <Text className="font-onest-semibold text-sm text-ink">
              {t('rental.return.fact', { days: actual !== undefined ? t('rental.days', { count: actual }) : '…' })}
            </Text>
            {p && p.overdueDays > 0 ? (
              <StatusBadge label={t('rental.return.overdueBadge', { count: p.overdueDays })} tone="err" />
            ) : p && p.unusedDays > 0 ? (
              <StatusBadge label={t('rental.return.earlyBadge')} tone="info" />
            ) : null}
          </View>
          <Text className="font-onest text-xs text-muted">
            {t('rental.return.daysNote', {
              start: formatDay(rental.startDate, lang),
              end: formatDay(rental.endDate, lang),
            })}
          </Text>
        </View>

        {/* Penalty (manual, R4/R10) */}
        <View className="bg-card rounded-xl p-3.5 gap-3">
          <Pressable
            onPress={() => setPenaltyOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: penaltyOpen }}
            className="flex-row items-center gap-2"
          >
            <Text className="flex-1 font-onest-bold text-[15px] text-ink">{t('rental.return.penalty')}</Text>
            <Text className={cn('font-onest-semibold text-sm', penaltyValue > 0 ? 'text-err-fg' : 'text-muted')}>
              {penaltyValue > 0 ? `${formatMoney(penaltyValue)} ${t('common.currency')}` : t('rental.return.none')}
            </Text>
            <View style={{ transform: [{ rotate: penaltyOpen ? '180deg' : '0deg' }] }}>
              <ChevronDown size={18} color={colors.muted} strokeWidth={2} />
            </View>
          </Pressable>
          {penaltyOpen ? (
            <>
              <MoneyField
                label={t('rental.return.amount')}
                value={penalty}
                onChange={(value) => {
                  setPenaltyTouched(true);
                  setPenalty(value);
                }}
              />
              <View className="gap-1.5">
                <Text className="font-onest-semibold text-[13px] text-soft">
                  {t('rental.return.reason')} <Text className="font-onest text-[13px] text-muted">{t('rental.return.required')}</Text>
                </Text>
                <TextInput
                  value={penaltyComment}
                  onChangeText={(text) => {
                    setPenaltyTouched(true);
                    setPenaltyComment(text);
                  }}
                  placeholder={t('rental.return.reasonPlaceholder')}
                  placeholderTextColor={colors.muted}
                  multiline
                  textAlignVertical="top"
                  className={cn(
                    'min-h-[64px] px-4 py-3 rounded-2xl bg-sunken font-onest text-base text-ink',
                    penaltyMissingReason && 'border-[1.5px] border-err-fg',
                  )}
                />
                {penaltyMissingReason ? (
                  <Text className="font-onest text-xs text-err-fg">{t('rental.return.penaltyReasonRequired')}</Text>
                ) : null}
              </View>
              <View className="flex-row flex-wrap gap-2">
                {(['torn', 'stain', 'late'] as const).map((key) => (
                  <Chip
                    key={key}
                    label={t(`rental.return.reasonChip.${key}`)}
                    tone="sunken"
                    onPress={() => {
                      setPenaltyTouched(true);
                      const text = t(`rental.return.reasonChip.${key}`);
                      setPenaltyComment((current) => (current.trim() ? `${current.trim()}, ${text.toLowerCase()}` : text));
                    }}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>

        {/* Early return: money back for unused days — OWNER/MANAGER (R4) */}
        {p && p.unusedDays > 0 ? (
          canManage ? (
            <View className="bg-card rounded-xl p-3.5 gap-3">
              <View className="flex-row items-baseline justify-between">
                <Text className="font-onest-bold text-[15px] text-ink">{t('rental.return.earlyTitle')}</Text>
                <Text className="font-onest text-xs text-muted">{t('rental.return.managerOnly')}</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                <Chip label="0" tone="sunken" selected={refundValue === 0} onPress={() => setRefund('')} />
                {Number(p.unusedDaysAmount) > 0 ? (
                  <Chip
                    label={t('rental.return.forDays', { days: t('rental.days', { count: p.unusedDays }) })}
                    tone="sunken"
                    selected={refundValue === Number(p.unusedDaysAmount)}
                    onPress={() => setRefund(formatMoney(Number(p.unusedDaysAmount)))}
                  />
                ) : null}
              </View>
              <MoneyField label={t('rental.return.amount')} value={refund} onChange={setRefund} invalid={refundTooBig} />
              <Text className="font-onest text-xs text-muted">
                {t('rental.return.unusedNote', {
                  days: t('rental.days', { count: p.unusedDays }),
                  amount: formatMoney(p.unusedDaysAmount),
                })}
              </Text>
            </View>
          ) : (
            <View className="bg-info-bg rounded-lg px-4 py-3">
              <Text className="font-onest-semibold text-[13px] leading-[18px] text-info-fg">{t('rental.return.earlyLocked')}</Text>
            </View>
          )
        ) : null}

        {/* Totals — all from the preview */}
        <View className="bg-hero rounded-2xl p-[18px] gap-2">
          {p ? (
            <>
              {Number(p.penaltyAmount) > 0 ? (
                <TotalLine label={t('rental.return.linePenalty')} value={`+${formatMoney(p.penaltyAmount)}`} tone="err" />
              ) : null}
              {Number(p.earlyReturnRefund) > 0 ? (
                <TotalLine label={t('rental.return.lineEarly')} value={`−${formatMoney(p.earlyReturnRefund)}`} tone="ok" />
              ) : null}
              <TotalLine label={t('rental.return.lineTotal')} value={formatMoney(p.newTotalAmount)} />
              <TotalLine label={t('rental.return.linePaid')} value={`−${formatMoney(p.paidAmount)}`} tone="ok" />
              <View className="h-px bg-hero-sub my-1" />
              <View className="flex-row items-center justify-between gap-2">
                <Text className={cn('font-onest-semibold text-sm', cashOut > 0 ? 'text-accent' : 'text-hero-warn')}>
                  {cashOut > 0 ? t('rental.return.giveBack') : due > 0 ? t('rental.return.toPay') : t('rental.return.settled')}
                </Text>
                {!fresh ? <ActivityIndicator size="small" color={colors.heroMuted} /> : null}
              </View>
              <Text className="font-onest-bold text-[32px] tracking-[-0.6px] text-hero-ink tabular-nums">
                {formatMoney(cashOut > 0 ? cashOut : due)} <Text className="font-onest text-[15px] text-hero-muted">{t('common.currency')}</Text>
              </Text>
            </>
          ) : preview.isError || !previewBody ? (
            <Text className="font-onest text-sm text-hero-muted">{t('rental.return.noPreview')}</Text>
          ) : (
            <ActivityIndicator color={colors.heroMuted} />
          )}
        </View>

        {/* Money: payment of the rest, or how the overpaid money goes back */}
        {p && cashOut > 0 ? (
          <View className="bg-card rounded-xl p-3.5 gap-3">
            <Text className="font-onest-bold text-[15px] text-ink">{t('rental.return.refundHow')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <Chip
                  key={m.type}
                  label={t(`sale.pay.method.${m.type}`)}
                  tone="sunken"
                  selected={refundMethod === m.type}
                  onPress={() => setRefundMethod(m.type)}
                />
              ))}
            </View>
          </View>
        ) : null}
        {p && due > 0 ? (
          <View className="gap-1.5">
            <View className="flex-row items-baseline justify-between px-1">
              <Text className="font-onest-bold text-[15px] text-ink">{t('rental.return.payment')}</Text>
              <Text className="font-onest text-xs text-muted">{t('rental.pay.optional')}</Text>
            </View>
            <PaymentMethodsInput
              selected={selected}
              amounts={amounts}
              onSelectedChange={setSelected}
              onAmountsChange={setAmounts}
              due={due}
            />
          </View>
        ) : null}

        {error ? (
          <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="px-4 pt-2 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
        {hint ? (
          <Text
            className={cn(
              'font-onest text-[13px] text-center',
              penaltyMissingReason || refundTooBig || overpaid || (preview.isError && !preview.isFetching)
                ? 'text-err-fg'
                : 'text-muted',
            )}
          >
            {hint}
          </Text>
        ) : null}
        <Button variant="accent" size="lg" full disabled={!canSubmit} loading={createReturn.isPending} onPress={submit}>
          {label}
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

function MoneyField({
  label,
  value,
  onChange,
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const { t } = useTranslation();
  const colors = useTheme();
  return (
    <View className="gap-1.5">
      <Text className="font-onest-semibold text-[13px] text-soft">{label}</Text>
      <View
        className={cn(
          'flex-row items-center h-[52px] px-4 rounded-2xl bg-sunken gap-2',
          invalid && 'border-[1.5px] border-err-fg',
        )}
      >
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.trim() === '' ? '' : formatMoney(digitsOf(text)))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.muted}
          accessibilityLabel={label}
          textAlignVertical="center"
          className="flex-1 min-w-0 h-11 py-0 font-onest-bold text-lg text-ink tabular-nums"
        />
        <Text className="font-onest text-sm text-muted">{t('common.currency')}</Text>
      </View>
    </View>
  );
}

function TotalLine({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'ok' | 'err' }) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <Text className="font-onest text-sm text-hero-muted">{label}</Text>
      <Text
        className={cn(
          'font-onest-semibold text-sm tabular-nums',
          tone === 'ok' ? 'text-accent' : tone === 'err' ? 'text-hero-err' : 'text-hero-ink',
        )}
      >
        {value}
      </Text>
    </View>
  );
}
