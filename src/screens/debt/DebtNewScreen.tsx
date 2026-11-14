import { Button, IconButton, Pressable, Text, TextArea, toast } from '@/components/base';
import { DatePickerSheet, EmptyState } from '@/components/common';
import { CustomerPickerSheet } from '@/components/order/CustomerPickerSheet';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatMoney } from '@/libs/format';
import { canCreateDebt } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import { addLocalDays, formatLocalDay, fromLocalDate, initials, toLocalDate } from '@/screens/rental/rental-format';
import type { OrderCustomer } from '@/services/customer';
import { useCreateDebt } from '@/services/debt';
import { router } from 'expo-router';
import { CalendarDays, ChevronLeft, CircleAlert, Info, Lock, Plus, Search } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Quick = '1w' | '2w' | '1m' | 'none';
type SheetName = 'none' | 'clients' | 'newClient' | 'created' | 'due';

const QUICK: Quick[] = ['1w', '2w', '1m', 'none'];
/** Up to 9 999 999 999 999 UZS */
const MAX_AMOUNT_DIGITS = 13;
const DESCRIPTION_MAX = 500;

/** Repay-by day of a quick chip, counted from today */
function quickDue(quick: Quick, today: string): string | null {
  if (quick === 'none') return null;
  if (quick === '1w') return addLocalDays(today, 7);
  if (quick === '2w') return addLocalDays(today, 14);
  const d = fromLocalDate(today);
  return toLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()));
}

/** End of the local day — «вернуть до 28.11» includes the 28th */
function endOfLocalDay(day: string): string {
  const d = fromLocalDate(day);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/**
 * «Новый долг» (design «DebtNew»): a debt the customer owed before STHM —
 * customer, amount, when it arose (may be in the past), repay-by date and a
 * comment. No money moves. Owner/manager only (the backend checks it).
 */
export function DebtNewScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const create = useCreateDebt();

  const today = toLocalDate(new Date());
  const [customer, setCustomer] = useState<OrderCustomer | null>(null);
  const [amount, setAmount] = useState('');
  const [created, setCreated] = useState(today);
  const [due, setDue] = useState<string | null>(null);
  const [quick, setQuick] = useState<Quick | null>(null);
  const [description, setDescription] = useState('');
  const [sheet, setSheet] = useState<SheetName>('none');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const header = (
    <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" accessibilityRole="header">{t('debtNew.title')}</Text>
        <Text className="font-onest text-[13px] text-muted">{t('debtNew.subtitle')}</Text>
      </View>
    </View>
  );

  if (!canCreateDebt(user)) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={Lock} message={t('debtNew.noAccess')} />
      </View>
    );
  }

  const sum = Number(amount || 0);
  const clientError = submitted && !customer;
  const amountError = submitted && sum < 1;
  const dateError = !!due && due < created;
  const isEmpty = !customer && sum < 1;

  const pickQuick = (q: Quick) => {
    setQuick(q);
    setDue(quickDue(q, today));
  };

  const pickCustomer = (c: OrderCustomer) => {
    setCustomer(c);
    setSheet('none');
  };

  const submit = () => {
    setSubmitted(true);
    setServerError(null);
    if (!customer || sum < 1 || dateError) return;
    create.mutate(
      {
        customerId: customer.id,
        amount: sum,
        description: description.trim() || undefined,
        // Today — the backend takes «now»; a past day — its start
        createdAt: created === today ? undefined : fromLocalDate(created).toISOString(),
        returnedAt: due ? endOfLocalDay(due) : undefined,
      },
      {
        onSuccess: () => {
          toast.show(t('debtNew.added', { name: customer.fullName, amount: formatMoney(sum) }));
          router.back();
        },
        onError: (err) => setServerError(getApiErrorMessage(err, t('debtNew.failed'))),
      },
    );
  };

  const customerMeta = customer
    ? [
        customer.phone,
        customer.debtTotal ? t('debtNew.owes', { amount: formatMoney(customer.debtTotal) }) : customer.debtTotal === 0 ? t('debtNew.noDebts') : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  const dateFields = [
    {
      key: 'created' as const,
      label: t('debtNew.created'),
      value: created === today ? t('debtNew.today', { date: formatLocalDay(today, lang) }) : formatLocalDay(created, lang),
      empty: false,
      invalid: false,
    },
    {
      key: 'due' as const,
      label: t('debtNew.due'),
      value: due ? formatLocalDay(due, lang) : quick === 'none' ? t('debtNew.quick.none') : t('debtNew.notSet'),
      empty: !due && quick !== 'none',
      invalid: dateError,
    },
  ];

  return (
    <View className="flex-1 bg-bg">
      {header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
          {/* Customer */}
          <View className="bg-card rounded-xl px-3.5 py-4 gap-3">
            <View className="flex-row items-baseline justify-between px-0.5">
              <Text className="font-onest-bold text-[15px] text-ink">{t('debtNew.customer')}</Text>
              <Text className="font-onest text-xs text-muted">{t('debtNew.required')}</Text>
            </View>
            {customer ? (
              <View className="flex-row items-center gap-3 p-2.5 rounded-[18px] bg-sunken">
                <View className="w-12 h-12 rounded-full bg-accent items-center justify-center">
                  <Text className="font-onest-bold text-base text-on-accent">{initials(customer.fullName)}</Text>
                </View>
                <View className="flex-1 min-w-0 gap-0.5">
                  <Text className="font-onest-bold text-base text-ink" numberOfLines={1}>{customer.fullName}</Text>
                  <Text className="font-onest text-[13px] text-muted tabular-nums" numberOfLines={1}>{customerMeta}</Text>
                </View>
                <Button variant="ghost" size="sm" className="bg-card" onPress={() => setSheet('clients')}>
                  {t('debtNew.change')}
                </Button>
              </View>
            ) : (
              <View className="gap-2">
                <Pressable
                  onPress={() => setSheet('clients')}
                  accessibilityRole="button"
                  className={cn(
                    'h-[52px] rounded-2xl bg-sunken px-4 flex-row items-center gap-2.5 border-2',
                    clientError ? 'border-err-fg' : 'border-transparent',
                  )}
                >
                  <Search size={20} color={colors.muted} strokeWidth={2} />
                  <Text className="font-onest-medium text-base text-muted">{t('debtNew.searchCustomer')}</Text>
                </Pressable>
                {clientError ? (
                  <Text className="font-onest-semibold text-xs text-err-fg px-0.5">{t('debtNew.customerRequired')}</Text>
                ) : null}
                <Button icon={Plus} onPress={() => setSheet('newClient')}>
                  {t('debtNew.addCustomer')}
                </Button>
              </View>
            )}
          </View>

          {/* Amount */}
          <View className="bg-hero rounded-[28px] p-5 gap-2.5">
            <Text className="font-onest text-sm text-hero-muted">{t('debtNew.amountLabel')}</Text>
            <View
              className={cn(
                'flex-row items-baseline gap-2 px-3.5 py-2.5 rounded-[18px] bg-hero-sub border-2',
                amountError ? 'border-hero-err' : 'border-transparent',
              )}
            >
              <TextInput
                value={amount ? formatMoney(amount) : ''}
                onChangeText={(text) => setAmount(text.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_AMOUNT_DIGITS))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.heroMuted}
                accessibilityLabel={t('debtNew.amountA11y')}
                className="flex-1 min-w-0 font-onest-bold text-[32px] text-hero-ink tabular-nums p-0"
              />
              <Text className="font-onest text-[15px] text-hero-muted">{t('common.currency')}</Text>
            </View>
            <Text className={cn('font-onest text-xs', amountError ? 'text-hero-err' : 'text-hero-muted')}>
              {amountError ? t('debtNew.amountRequired') : t('debtNew.amountHint')}
            </Text>
          </View>

          {/* Dates */}
          <View className="bg-card rounded-xl px-3.5 py-4 gap-3">
            <Text className="font-onest-bold text-[15px] text-ink px-0.5">{t('debtNew.dates')}</Text>
            <View className="flex-row gap-2">
              {dateFields.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setSheet(f.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${f.label}: ${f.value}`}
                  className={cn(
                    'flex-1 h-16 rounded-2xl bg-sunken px-3.5 flex-row items-center gap-2 border-2',
                    f.invalid ? 'border-err-fg' : 'border-transparent',
                  )}
                >
                  <View className="flex-1 min-w-0 gap-0.5">
                    <Text className="font-onest-semibold text-xs text-soft">{f.label}</Text>
                    <Text
                      className={cn(
                        'text-[15px]',
                        f.empty ? 'font-onest-medium text-muted' : 'font-onest-bold',
                        f.invalid ? 'text-err-fg' : !f.empty && 'text-ink',
                      )}
                      numberOfLines={1}
                    >
                      {f.value}
                    </Text>
                  </View>
                  <CalendarDays size={18} color={colors.muted} strokeWidth={2} />
                </Pressable>
              ))}
            </View>
            {dateError ? (
              <Text className="font-onest-semibold text-xs text-err-fg px-0.5">{t('debtNew.dateError')}</Text>
            ) : null}
            <View className="gap-1.5">
              <Text className="font-onest text-xs text-muted px-0.5">{t('debtNew.returnIn')}</Text>
              <View className="flex-row gap-1.5">
                {QUICK.map((q) => {
                  const on = q === quick;
                  return (
                    <Pressable
                      key={q}
                      onPress={() => pickQuick(q)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      className={cn('flex-1 h-9 rounded-pill items-center justify-center px-1.5', on ? 'bg-primary' : 'bg-sunken')}
                    >
                      <Text className={cn('font-onest-semibold text-xs', on ? 'text-on-primary' : 'text-ink')} numberOfLines={1}>
                        {t(`debtNew.quick.${q}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Comment */}
          <View className="bg-card rounded-xl px-3.5 py-4 gap-2">
            <Text className="font-onest-bold text-[15px] text-ink px-0.5">
              {t('debtNew.comment')} <Text className="font-onest text-xs text-muted">· {t('debtNew.optional')}</Text>
            </Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder={t('debtNew.commentPlaceholder')}
              maxLength={DESCRIPTION_MAX}
              rows={3}
            />
          </View>

          <View className="flex-row items-start gap-2.5 px-1">
            <Info size={16} color={colors.muted} strokeWidth={2} />
            <Text className="flex-1 font-onest text-xs leading-[17px] text-muted">{t('debtNew.note')}</Text>
          </View>
        </ScrollView>

        <View className="px-4 pt-3 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
          {serverError ? (
            <View className="flex-row items-start gap-2 bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
              <CircleAlert size={16} color={colors.errFg} strokeWidth={2} />
              <Text className="flex-1 font-onest-semibold text-[13px] leading-[18px] text-err-fg">{serverError}</Text>
            </View>
          ) : null}
          {isEmpty ? <Text className="font-onest text-xs text-muted text-center">{t('debtNew.fillHint')}</Text> : null}
          <Button variant="accent" size="lg" full disabled={isEmpty} loading={create.isPending} onPress={submit}>
            {create.isPending
              ? t('debtNew.saving')
              : sum >= 1
                ? t('debtNew.submitAmount', { amount: formatMoney(sum) })
                : t('debtNew.submit')}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <CustomerPickerSheet
        isOpen={sheet === 'clients' || sheet === 'newClient'}
        startCreating={sheet === 'newClient'}
        selectedId={customer?.id}
        onClose={() => setSheet('none')}
        onSelect={pickCustomer}
      />
      <DatePickerSheet
        isOpen={sheet === 'created'}
        onClose={() => setSheet('none')}
        title={t('debtNew.createdTitle')}
        subtitle={t('debtNew.createdHint')}
        value={created}
        max={today}
        onPick={(day) => {
          setCreated(day);
          setSheet('none');
        }}
      />
      <DatePickerSheet
        isOpen={sheet === 'due'}
        onClose={() => setSheet('none')}
        title={t('debtNew.dueTitle')}
        value={due}
        min={created}
        onPick={(day) => {
          setDue(day);
          setQuick(null);
          setSheet('none');
        }}
      />
    </View>
  );
}
