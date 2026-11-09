import { Button, Chip, IconButton, Stepper, Text, toast } from '@/components/base';
import { CashboxPickerSheet } from '@/components/cashbox';
import { digitsOf, PAYMENT_METHODS } from '@/components/order';
import { useDebounce } from '@/hooks/use-debounce';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { getVariantLabel } from '@/libs/product-utils';
import { cn } from '@/libs/utils';
import type { ProductDetail, ProductVariant } from '@/models/product.model';
import { useOpenCashboxes } from '@/services/cashbox';
import { PaymentType } from '@/services/order/order.type';
import {
  RentalErrorCode,
  useCleaningCheck,
  useCreateCleaning,
  useRentalCalendar,
  type RentalCleaningConflictDay,
} from '@/services/rental';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addLocalDays,
  formatLocalDay,
  formatLocalDays,
  formatMonth,
  monthEnd,
  monthGrid,
  monthStart,
  salonDate,
  toLocalDate,
  weekDayLabels,
} from './rental-format';

/** Must match MAX_CLEANING_DAYS of the backend DTO */
const MAX_CLEANING_DAYS = 30;
const CHECK_DEBOUNCE_MS = 300;

interface CleaningNewScreenProps {
  product: ProductDetail;
  variant: ProductVariant;
}

/**
 * «В химчистку» (design «Аренда · товар и настройки» 13, R13; without the
 * «Экземпляр» block — one unit of the variant). The first day on the month
 * grid, days 1…30, the expense. Whether a unit is free is asked from the
 * backend as the user picks (`/rental/cleanings/check`); a booking that would
 * lose its unit blocks saving. The expense goes to the cashbox at once.
 */
export function CleaningNewScreen({ product, variant }: CleaningNewScreenProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const today = toLocalDate(new Date());

  const [month, setMonth] = useState(monthStart(today));
  const [day, setDay] = useState<string | null>(null);
  const [days, setDays] = useState(1);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentType>(PaymentType.CASH);
  const [comment, setComment] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: openCashboxes } = useOpenCashboxes();
  const create = useCreateCleaning();
  const calendar = useRentalCalendar({
    warehouseId: product.warehouseId,
    variantIds: [variant.id],
    from: month,
    to: monthEnd(month),
  });
  const calendarDays = new Map((calendar.data?.variants[0]?.days ?? []).map((d) => [d.date, d]));

  const checkParams = useMemo(
    () => (day ? { warehouseId: product.warehouseId, variantId: variant.id, startDate: day, days } : null),
    [day, days, product.warehouseId, variant.id],
  );
  const debouncedParams = useDebounce(checkParams, CHECK_DEBOUNCE_MS);
  const check = useCleaningCheck(debouncedParams);
  // An answer for other inputs (still debouncing / loading) is not shown as final
  const checkCurrent = !!day && debouncedParams === checkParams && !check.isPlaceholderData && !check.isFetching;
  const result = checkCurrent ? check.data : undefined;
  const conflict = result?.ok === false;

  const lastDay = day ? addLocalDays(day, days - 1) : null;
  const freeFrom = day ? addLocalDays(day, days) : null;
  const range = new Set(day ? Array.from({ length: days }, (_, i) => addLocalDays(day, i)) : []);
  const conflictDays = new Set((conflict ? result.conflicts : []).map((c) => c.date));

  const amountValue = digitsOf(amount);
  const ready = !!day && amountValue > 0 && result?.ok === true;

  let hint = '';
  if (!day && !amountValue) hint = t('rental.cleaningNew.hintAll');
  else if (!day) hint = t('rental.cleaningNew.hintDay');
  else if (conflict) hint = t('rental.cleaningNew.hintConflict');
  else if (check.isError && checkCurrent) hint = getApiErrorMessage(check.error, t('rental.cleaningNew.checkFailed'));
  else if (!amountValue) hint = t('rental.cleaningNew.hintAmount');

  const shiftMonth = (step: number) => {
    const [y, m] = month.split('-').map(Number);
    setMonth(toLocalDate(new Date(y, m - 1 + step, 1)));
  };

  const send = (cashboxId?: string) => {
    if (!day || !lastDay) return;
    setError(null);
    create.mutate(
      {
        warehouseId: product.warehouseId,
        variantId: variant.id,
        startDate: day,
        days,
        amount: amountValue,
        paymentType: method,
        comment: comment.trim() || undefined,
        cashboxId,
      },
      {
        onSuccess: () => {
          toast.show(
            t('rental.cleaningNew.saved', {
              dates: formatLocalDays(day, lastDay, lang),
              amount: formatMoney(amountValue),
            }),
            'success',
          );
          router.back();
        },
        onError: (err) => {
          const body = err.response?.data;
          if (body?.code === RentalErrorCode.NOT_AVAILABLE) {
            // A booking appeared after the check: refresh it to show who holds the unit
            setError(t('rental.cleaningNew.notAvailable'));
            check.refetch();
          } else {
            setError(getApiErrorMessage(err, t('rental.cleaningNew.failed')));
          }
        },
      },
    );
  };

  const submit = () => {
    if (!ready || create.isPending) return;
    // The expense needs an open cashbox: the own one (the backend takes it) or a chosen one
    if (!openCashboxes?.some((c) => c.isMine)) setPickerOpen(true);
    else send();
  };

  const subtitle = [product.name, getVariantLabel(variant)].filter(Boolean).join(' · ');

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        <View className="flex-1 min-w-0">
          <Text className="type-heading text-ink" accessibilityRole="header">{t('rental.cleaningNew.title')}</Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
      >
        <View className="bg-card rounded-xl px-3 pt-4 pb-3.5 gap-2.5">
          <View className="flex-row items-center gap-2">
            <IconButton icon={ChevronLeft} variant="sunken" size="sm" accessibilityLabel={t('rental.agenda.prev')} onPress={() => shiftMonth(-1)} />
            <View className="flex-1 items-center">
              <Text className="font-onest-bold text-[15px] text-ink">{t('rental.cleaningNew.when')}</Text>
              <Text className="font-onest text-xs text-muted">{formatMonth(month, lang)}</Text>
            </View>
            <IconButton icon={ChevronRight} variant="sunken" size="sm" accessibilityLabel={t('rental.agenda.next')} onPress={() => shiftMonth(1)} />
          </View>

          <View className="flex-row">
            {weekDayLabels(lang).map((label) => (
              <Text key={label} className="flex-1 text-center font-onest-semibold text-[11px] uppercase text-muted">
                {label}
              </Text>
            ))}
          </View>
          {calendar.isLoading ? (
            <ActivityIndicator color={colors.muted} className="py-6" />
          ) : (
            <View className="flex-row flex-wrap">
              {monthGrid(month).map((date, i) => {
                if (!date) return <View key={`pad-${i}`} className="w-[14.28%] h-11" />;
                const info = calendarDays.get(date);
                const past = date < today;
                const full = !!info && info.available === 0;
                const cleaning = !!info && info.cleaning > 0;
                // Busy only because of dry cleaning — blue, bookings — red
                const cleaningOnly = cleaning && info.busy === info.cleaning;
                const selected = range.has(date);
                const bad = selected && (conflictDays.has(date) || full);
                return (
                  <View key={date} className="w-[14.28%] p-0.5">
                    <Pressable
                      disabled={past}
                      onPress={() => setDay(date)}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: past }}
                      accessibilityLabel={[
                        formatLocalDay(date, lang),
                        cleaningOnly
                          ? t('rental.cleaningNew.legendCleaning')
                          : full
                            ? t('rental.cleaningNew.legendBusy')
                            : '',
                      ]
                        .filter(Boolean)
                        .join(', ')}
                      className={cn(
                        'h-10 rounded-md items-center justify-center',
                        bad ? 'bg-err-fg' : selected ? 'bg-primary' : cleaningOnly ? 'bg-info-bg' : full ? 'bg-err-bg' : '',
                        !selected && cleaning && !cleaningOnly && 'border-2 border-info-fg',
                        date === today && 'border-2 border-accent',
                        past && 'opacity-35',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-sm tabular-nums',
                          selected || date === today ? 'font-onest-bold' : 'font-onest-medium',
                          bad || selected ? 'text-on-primary' : cleaningOnly ? 'text-info-fg' : full ? 'text-err-fg' : 'text-ink',
                        )}
                      >
                        {Number(date.slice(8))}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
          <View className="flex-row flex-wrap justify-center gap-x-3 gap-y-1">
            {[
              { cls: 'bg-err-bg', label: t('rental.cleaningNew.legendBusy') },
              { cls: 'bg-info-bg', label: t('rental.cleaningNew.legendCleaning') },
              { cls: 'bg-primary', label: t('rental.cleaningNew.legendPicked') },
            ].map((l) => (
              <View key={l.label} className="flex-row items-center gap-1.5">
                <View className={cn('w-3 h-3 rounded-sm', l.cls)} />
                <Text className="font-onest text-xs text-muted">{l.label}</Text>
              </View>
            ))}
          </View>

          <View className="h-px bg-line mx-1" />
          <View className="flex-row items-center gap-3 px-1">
            <View className="flex-1 min-w-0 gap-0.5">
              <Text className="font-onest-semibold text-[15px] text-ink">{t('rental.cleaningNew.days')}</Text>
              <Text className="font-onest text-xs text-muted">
                {freeFrom
                  ? t('rental.cleaningNew.freeFrom', { date: formatLocalDay(freeFrom, lang) })
                  : t('rental.cleaningNew.freeFromHint')}
              </Text>
            </View>
            <Stepper value={days} onChange={setDays} min={1} max={MAX_CLEANING_DAYS} size="sm" />
          </View>

          {day && !checkCurrent ? (
            <View className="flex-row items-center gap-2 px-1">
              <ActivityIndicator size="small" color={colors.muted} />
              <Text className="font-onest text-xs text-muted">{t('rental.cleaningNew.checking')}</Text>
            </View>
          ) : null}
          {conflict ? <ConflictAlert conflicts={result.conflicts} /> : null}
        </View>

        <View className="bg-card rounded-xl p-3.5 gap-3">
          <Text className="font-onest-bold text-[15px] text-ink px-0.5">{t('rental.cleaningNew.expense')}</Text>
          <View className="gap-1.5">
            <Text className="font-onest-semibold text-[13px] text-soft">{t('rental.cleaningNew.amount')}</Text>
            <View className="flex-row items-center h-14 px-4 rounded-2xl bg-sunken gap-2.5">
              <TextInput
                value={amount}
                onChangeText={(text) => setAmount(text.trim() === '' ? '' : formatMoney(digitsOf(text)))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.muted}
                accessibilityLabel={t('rental.cleaningNew.amount')}
                className="flex-1 min-w-0 font-onest-bold text-xl text-ink tabular-nums"
              />
              <Text className="font-onest text-[13px] text-muted">{t('common.currency')}</Text>
            </View>
          </View>
          <View className="gap-1.5">
            <Text className="font-onest-semibold text-[13px] text-soft">{t('rental.cleaningNew.method')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <Chip
                  key={m.type}
                  label={t(`sale.pay.method.${m.type}`)}
                  tone="sunken"
                  selected={method === m.type}
                  onPress={() => setMethod(m.type)}
                />
              ))}
            </View>
            <Text className="font-onest text-xs text-muted px-0.5">
              {method === PaymentType.CASH ? t('rental.cleaningNew.methodCash') : t('rental.cleaningNew.methodOther')}
            </Text>
          </View>
          <View className="gap-1.5">
            <Text className="font-onest-semibold text-[13px] text-soft">
              {t('rental.cleaningNew.comment')} <Text className="font-onest text-[13px] text-muted">{t('rental.cleaningNew.optional')}</Text>
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              maxLength={500}
              placeholder={t('rental.cleaningNew.commentPlaceholder')}
              placeholderTextColor={colors.muted}
              className="h-[52px] px-4 rounded-2xl bg-sunken font-onest-medium text-[15px] text-ink"
            />
          </View>
        </View>

        <View className="bg-hero rounded-2xl p-5 gap-3">
          <Text className="font-onest text-sm text-hero-muted">{t('rental.cleaningNew.blocked')}</Text>
          <Text className="font-onest-bold text-[26px] tracking-[-0.3px] text-hero-ink -mt-1.5">
            {day && lastDay ? formatLocalDays(day, lastDay, lang) : '—'}
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1 rounded-lg bg-hero-sub px-3 py-2.5 gap-0.5">
              <Text className="font-onest-semibold text-xs text-hero-muted">{t('rental.cleaningNew.freeAgain')}</Text>
              <Text className="font-onest-bold text-base text-hero-ink">
                {freeFrom ? t('rental.cleaningNew.noonOf', { date: formatLocalDay(freeFrom, lang) }) : '—'}
              </Text>
            </View>
            <View className="flex-1 rounded-lg bg-hero-sub px-3 py-2.5 gap-0.5">
              <Text className="font-onest-semibold text-xs text-hero-muted">{t('rental.cleaningNew.expense')}</Text>
              <Text className="font-onest-bold text-base text-hero-ink tabular-nums">
                {formatMoney(amountValue)} <Text className="font-onest-medium text-[11px] text-hero-muted">{t('common.currency')}</Text>
              </Text>
            </View>
          </View>
        </View>

        {error ? (
          <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="px-4 pt-2 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
        {hint ? (
          <Text className={cn('font-onest text-[13px] text-center', conflict ? 'text-err-fg' : 'text-muted')}>{hint}</Text>
        ) : null}
        <Button variant="accent" size="lg" full disabled={!ready} loading={create.isPending} onPress={submit}>
          {amountValue > 0
            ? t('rental.cleaningNew.saveAmount', { amount: formatMoney(amountValue) })
            : t('rental.cleaningNew.save')}
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

/** Days short of a unit and who holds it: «18 мая — бронь №A1B2C3 · Азиз К.» */
function ConflictAlert({ conflicts }: { conflicts: RentalCleaningConflictDay[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  return (
    <View className="flex-row gap-2.5 items-start rounded-lg bg-err-bg px-3.5 py-3 mx-0.5" accessibilityRole="alert">
      <CircleAlert size={18} color={colors.errFg} strokeWidth={2} style={{ marginTop: 1 }} />
      <View className="flex-1 min-w-0 gap-1">
        {conflicts.map((c) => {
          const holders = [
            ...c.rentals.map((r) =>
              t('rental.cleaningNew.conflictBooking', { code: r.code, customer: r.customerName ?? t('rental.noCustomer') }),
            ),
            ...c.cleanings.map((cl) =>
              t('rental.cleaningNew.conflictCleaning', {
                dates: formatLocalDays(salonDate(cl.startDate), addLocalDays(salonDate(cl.endDate), -1), lang),
              }),
            ),
          ];
          return (
            <Text key={c.date} className="font-onest text-sm leading-5 text-err-fg">
              <Text className="font-onest-bold text-sm text-err-fg">{formatLocalDay(c.date, lang)}</Text> — {holders.join('; ')}
            </Text>
          );
        })}
        <Text className="font-onest text-[13px] text-err-fg">{t('rental.cleaningNew.conflictHint')}</Text>
      </View>
    </View>
  );
}
