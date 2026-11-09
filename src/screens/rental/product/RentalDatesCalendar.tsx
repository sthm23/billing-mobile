import { IconButton, Text } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';
import {
  formatLocalDate,
  formatLocalDays,
  formatMonth,
  monthGrid,
  monthStart,
  toLocalDate,
  weekDayLabels,
} from '../rental-format';

export interface CalendarDay {
  busy: number;
  available: number;
  /** Units in planned dry cleaning that day, part of busy */
  cleaning: number;
}

interface RentalDatesCalendarProps {
  /** YYYY-MM-01 of the shown month */
  month: string;
  onMonthChange: (month: string) => void;
  /** Occupancy of the selected variant by YYYY-MM-DD (`GET /rental/calendar`) */
  days: Map<string, CalendarDay>;
  /** Units the salon owns; 0 — occupancy is not shown */
  owned: number;
  loading: boolean;
  /** Picked issue day */
  start: string | null;
  /** Return day: picked, or the day after a single picked day */
  end: string | null;
  onPick: (day: string) => void;
  onClear: () => void;
}

/**
 * Issue / return fields and the month grid of the selected variant: past days
 * can't be picked; busy days are tinted (partly / all busy), planned dry
 * cleaning is a blue bar. The first tap is the issue day, the second the return day.
 */
export function RentalDatesCalendar({
  month,
  onMonthChange,
  days,
  owned,
  loading,
  start,
  end,
  onPick,
  onClear,
}: RentalDatesCalendarProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const today = toLocalDate(new Date());
  const canGoBack = month > monthStart(today);

  const shiftMonth = (step: number) => {
    const [y, m] = month.split('-').map(Number);
    onMonthChange(toLocalDate(new Date(y, m - 1 + step, 1)));
  };

  const fields = [
    { label: t('rental.product.issue'), value: start },
    { label: t('rental.product.return'), value: end },
  ];

  return (
    <View className="bg-card rounded-xl px-3 pt-4 pb-3.5 gap-3">
      <View className="flex-row gap-2 px-0.5">
        {fields.map((f) => (
          <View key={f.label} className="flex-1 h-[60px] rounded-lg bg-sunken px-3.5 justify-center gap-0.5">
            <Text className="font-onest-semibold text-xs text-soft">{f.label}</Text>
            <Text
              className={cn('text-base', f.value ? 'font-onest-bold text-ink' : 'font-onest-medium text-muted')}
              numberOfLines={1}
            >
              {f.value ? formatLocalDate(f.value, lang) : t('rental.product.pickDay')}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-center gap-2">
        <IconButton
          icon={ChevronLeft}
          variant="sunken"
          size="sm"
          accessibilityLabel={t('rental.form.prevMonth')}
          disabled={!canGoBack}
          onPress={() => shiftMonth(-1)}
        />
        <View className="flex-1 items-center">
          <Text className="font-onest-bold text-[15px] text-ink capitalize">{formatMonth(month, lang)}</Text>
          <Text className="font-onest text-xs text-muted" numberOfLines={1}>
            {start && end
              ? t('rental.product.calPicked', { dates: formatLocalDays(start, end, lang) })
              : t('rental.product.calPick')}
          </Text>
        </View>
        <IconButton
          icon={ChevronRight}
          variant="sunken"
          size="sm"
          accessibilityLabel={t('rental.form.nextMonth')}
          onPress={() => shiftMonth(1)}
        />
      </View>

      <View className="flex-row">
        {weekDayLabels(lang).map((label, i) => (
          <Text
            key={label}
            className={cn('flex-1 text-center font-onest-semibold text-[11px] uppercase', i > 4 ? 'text-err-fg' : 'text-muted')}
          >
            {label}
          </Text>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.muted} className="py-6" />
      ) : (
        <View className="flex-row flex-wrap">
          {monthGrid(month).map((day, i) => {
            if (!day) return <View key={`pad-${i}`} className="w-[14.28%] h-12" />;
            const d = days.get(day);
            const past = day < today;
            const full = !!d && owned > 0 && d.available === 0;
            const partly = !!d && d.busy > 0 && !full;
            const cleaningOnly = !!d && d.cleaning > 0 && d.busy === d.cleaning && !full;
            const selected = !!start && !!end && day >= start && day <= end;
            const edge = day === start || day === end;
            const bg = selected
              ? full && day !== end
                ? 'bg-err-fg'
                : 'bg-primary'
              : cleaningOnly
                ? 'bg-info-bg'
                : full
                  ? 'bg-err-bg'
                  : partly
                    ? 'bg-warn-bg'
                    : '';
            const fg = selected
              ? 'text-on-primary'
              : cleaningOnly
                ? 'text-info-fg'
                : full
                  ? 'text-err-fg'
                  : partly
                    ? 'text-warn-fg'
                    : 'text-ink';
            return (
              <View key={day} className="w-[14.28%] px-px py-0.5">
                <Pressable
                  onPress={() => onPick(day)}
                  disabled={past}
                  accessibilityRole="button"
                  accessibilityState={{ selected: edge, disabled: past }}
                  accessibilityLabel={t('rental.item.dayA11y', {
                    date: formatLocalDate(day, lang),
                    free: d?.available ?? owned,
                    total: owned,
                  })}
                  className={cn(
                    'h-11 items-center justify-center gap-0.5',
                    selected ? (edge ? 'rounded-md' : 'rounded-sm') : 'rounded-md',
                    bg,
                    !selected && day === today && 'border-2 border-accent',
                    past && !selected && 'opacity-40',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm tabular-nums',
                      selected || day === today ? 'font-onest-bold' : 'font-onest-medium',
                      fg,
                    )}
                  >
                    {Number(day.slice(8))}
                  </Text>
                  <View
                    className={cn(
                      'w-3.5 h-[3px] rounded-full',
                      d && d.cleaning > 0 ? (selected ? 'bg-on-primary' : 'bg-info-fg') : 'bg-transparent',
                    )}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <View className="flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-sm border-[1.5px] border-line" />
          <Text className="font-onest text-xs text-muted">{t('rental.product.legendFree')}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-sm bg-warn-bg" />
          <Text className="font-onest text-xs text-muted">{t('rental.item.partlyBusy')}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-sm bg-err-bg" />
          <Text className="font-onest text-xs text-muted">{t('rental.item.allBusy')}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3.5 h-[3px] rounded-full bg-info-fg" />
          <Text className="font-onest text-xs text-muted">{t('rental.cleaningCard.legend')}</Text>
        </View>
        {start ? (
          <Pressable onPress={onClear} accessibilityRole="button" hitSlop={8} className="active:opacity-70">
            <Text className="font-onest-semibold text-xs text-ink underline">{t('rental.product.clear')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
