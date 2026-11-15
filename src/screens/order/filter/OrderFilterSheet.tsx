import { Button, Chip, IconButton, Pressable, Text } from '@/components/base';
import { Sheet } from '@/components/base/Sheet';
import { DatePickerSheet } from '@/components/common';
import { CustomerPickerSheet } from '@/components/order';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { formatLocalDay, toLocalDate } from '@/screens/rental/rental-format';
import { CalendarDays, ChevronRight, UserRound, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { EMPTY_FILTER, PERIODS, TAB_STATUSES, toggleStatus, type OrderFilter, type OrderTab } from './order-filter';

interface OrderFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tab: OrderTab;
  value: OrderFilter;
  onApply: (filter: OrderFilter) => void;
}

type Picker = 'none' | 'customer' | 'from' | 'to';

/**
 * Orders filter: period (quick chips or own «С / По»), customer (search by
 * name or phone) and the statuses of the current tab. Edits a draft;
 * «Показать» applies it, «Сбросить» clears it.
 */
export function OrderFilterSheet({ isOpen, onClose, tab, value, onApply }: OrderFilterSheetProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const today = toLocalDate(new Date());
  const [draft, setDraft] = useState<OrderFilter>(value);
  const [picker, setPicker] = useState<Picker>('none');

  useEffect(() => {
    if (isOpen) setDraft(value);
  }, [isOpen, value]);

  const set = (patch: Partial<OrderFilter>) => setDraft((d) => ({ ...d, ...patch }));
  const dateLabel = tab === 'completed' ? t('orderFilter.bySaleDate') : t('orderFilter.byCreatedDate');

  const dateFields = [
    { key: 'from' as const, label: t('orderFilter.from'), value: draft.from },
    { key: 'to' as const, label: t('orderFilter.to'), value: draft.to },
  ];

  return (
    <>
      <Sheet isOpen={isOpen} onClose={onClose} size="auto">
        <View className="px-4 pt-1 pb-3 gap-4">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 type-title text-ink" accessibilityRole="header">{t('orderFilter.title')}</Text>
            <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
          </View>

          {/* Period */}
          <View className="gap-2">
            <View className="flex-row items-baseline justify-between px-0.5">
              <Text className="font-onest-bold text-[15px] text-ink">{t('orderFilter.period')}</Text>
              <Text className="font-onest text-xs text-muted">{dateLabel}</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {PERIODS.map((p) => (
                <Chip
                  key={p}
                  label={t(`orderFilter.periods.${p}`)}
                  tone="sunken"
                  selected={draft.period === p}
                  onPress={() =>
                    draft.period === p
                      ? set({ period: null, from: null, to: null })
                      : set({ period: p, from: p === 'custom' ? draft.from : null, to: p === 'custom' ? draft.to : null })
                  }
                />
              ))}
            </View>
            {draft.period === 'custom' ? (
              <View className="flex-row gap-2">
                {dateFields.map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => setPicker(f.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${f.label}: ${f.value ? formatLocalDay(f.value, lang) : t('orderFilter.pickDay')}`}
                    className="flex-1 h-14 rounded-2xl bg-sunken px-3.5 flex-row items-center gap-2"
                  >
                    <View className="flex-1 min-w-0 gap-0.5">
                      <Text className="font-onest-semibold text-xs text-soft">{f.label}</Text>
                      <Text
                        className={cn('text-[15px]', f.value ? 'font-onest-bold text-ink' : 'font-onest-medium text-muted')}
                        numberOfLines={1}
                      >
                        {f.value ? formatLocalDay(f.value, lang) : t('orderFilter.pickDay')}
                      </Text>
                    </View>
                    <CalendarDays size={18} color={colors.muted} strokeWidth={2} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          {/* Customer */}
          <View className="gap-2">
            <Text className="font-onest-bold text-[15px] text-ink px-0.5">{t('orderFilter.customer')}</Text>
            <Pressable
              onPress={() => setPicker('customer')}
              accessibilityRole="button"
              className="h-14 rounded-2xl bg-sunken pl-3.5 pr-2 flex-row items-center gap-3"
            >
              <UserRound size={18} color={draft.customer ? colors.ink : colors.muted} strokeWidth={2} />
              <View className="flex-1 min-w-0">
                <Text
                  className={cn('text-[15px]', draft.customer ? 'font-onest-semibold text-ink' : 'font-onest-medium text-muted')}
                  numberOfLines={1}
                >
                  {draft.customer ? draft.customer.fullName : t('orderFilter.anyCustomer')}
                </Text>
                {draft.customer?.phone ? (
                  <Text className="font-onest text-xs text-muted" numberOfLines={1}>{draft.customer.phone}</Text>
                ) : null}
              </View>
              {draft.customer ? (
                <IconButton icon={X} size="sm" variant="card" accessibilityLabel={t('orderFilter.clearCustomer')} onPress={() => set({ customer: null })} />
              ) : (
                <ChevronRight size={18} color={colors.muted} strokeWidth={2} />
              )}
            </Pressable>
          </View>

          {/* Status of the current tab */}
          <View className="gap-2">
            <Text className="font-onest-bold text-[15px] text-ink px-0.5">{t('orderFilter.status')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {TAB_STATUSES[tab].map((s) => (
                <Chip
                  key={s}
                  label={t(`orderFilter.statuses.${s}`)}
                  tone="sunken"
                  selected={draft.statuses.includes(s)}
                  onPress={() => set({ statuses: toggleStatus(draft.statuses, s) })}
                />
              ))}
            </View>
          </View>

          <View className="flex-row gap-2.5 pt-1">
            <Button variant="secondary" size="lg" className="flex-1" onPress={() => setDraft(EMPTY_FILTER)}>
              {t('orderFilter.reset')}
            </Button>
            <Button variant="accent" size="lg" className="flex-1" onPress={() => onApply(draft)}>
              {t('orderFilter.apply')}
            </Button>
          </View>
        </View>
      </Sheet>

      <CustomerPickerSheet
        isOpen={picker === 'customer'}
        allowCreate={false}
        selectedId={draft.customer?.id}
        onClose={() => setPicker('none')}
        onSelect={(customer) => {
          set({ customer });
          setPicker('none');
        }}
      />
      <DatePickerSheet
        isOpen={picker === 'from'}
        onClose={() => setPicker('none')}
        title={t('orderFilter.from')}
        value={draft.from}
        max={draft.to ?? today}
        onPick={(day) => {
          set({ from: day });
          setPicker('none');
        }}
      />
      <DatePickerSheet
        isOpen={picker === 'to'}
        onClose={() => setPicker('none')}
        title={t('orderFilter.to')}
        value={draft.to}
        min={draft.from ?? undefined}
        max={today}
        onPick={(day) => {
          set({ to: day });
          setPicker('none');
        }}
      />
    </>
  );
}
