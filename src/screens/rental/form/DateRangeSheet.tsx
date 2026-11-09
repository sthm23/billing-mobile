import { Button, IconButton, Text } from '@/components/base';
import { Sheet } from '@/components/base/Sheet';
import { cn } from '@/libs/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { bookingDays, effectiveEnd, formatLocalDate, fromLocalDate, pickRangeDay, toLocalDate } from '../rental-format';

const LOCALES: Record<string, string> = { ru: 'ru-RU', uz: 'uz-UZ', en: 'en-GB' };
/** A Monday, to name the week days */
const A_MONDAY = new Date(2024, 0, 1);

export interface DateRange {
  /** YYYY-MM-DD, issue day */
  start: string;
  /** YYYY-MM-DD, return day (after start) */
  end: string;
}

interface DateRangeSheetProps {
  isOpen: boolean;
  value: DateRange | null;
  /** YYYY-MM-DD; earlier days can't be picked */
  minDate?: string;
  onClose: () => void;
  onChange: (range: DateRange) => void;
}

/**
 * Picks the booking dates on a month grid: the first tap is the issue day, the
 * second the return day. One day (or the same day twice) means a one-day
 * booking: back the next day by 12:00 (R1/R2 — no same-day bookings).
 */
export function DateRangeSheet({ isOpen, value, minDate, onClose, onChange }: DateRangeSheetProps) {
  const { t, i18n } = useTranslation();
  const locale = LOCALES[i18n.language] ?? LOCALES.ru;
  const [start, setStart] = useState<string | null>(value?.start ?? null);
  const [end, setEnd] = useState<string | null>(value?.end ?? null);
  const [month, setMonth] = useState(() => {
    const d = value ? fromLocalDate(value.start) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    if (!isOpen) return;
    setStart(value?.start ?? null);
    setEnd(value?.end ?? null);
    const d = value ? fromLocalDate(value.start) : new Date();
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [isOpen, value]);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(A_MONDAY.getFullYear(), 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }),
      ),
    [locale],
  );

  // Monday-first grid of the month, padded with empty cells
  const cells = useMemo(() => {
    const first = (month.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const list: (string | null)[] = Array.from({ length: first }, () => null);
    for (let day = 1; day <= count; day++) {
      list.push(toLocalDate(new Date(month.getFullYear(), month.getMonth(), day)));
    }
    while (list.length % 7) list.push(null);
    return list;
  }, [month]);

  const today = toLocalDate(new Date());
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const canGoBack = !minDate || month > thisMonth;

  const pick = (day: string) => {
    const next = pickRangeDay({ start, end }, day);
    setStart(next.start);
    setEnd(next.end);
  };

  const done = () => {
    if (!start) return;
    onChange({ start, end: effectiveEnd(start, end) });
    onClose();
  };

  const shownEnd = start ? effectiveEnd(start, end) : null;
  const summary = start && shownEnd
    ? t('rental.form.datesSummary', {
        from: formatLocalDate(start, i18n.language),
        to: formatLocalDate(shownEnd, i18n.language),
        days: t('rental.days', { count: bookingDays(start, shownEnd) }),
      })
    : t('rental.form.pickIssueDay');

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3">
        <View className="flex-row items-center justify-between">
          <IconButton
            icon={ChevronLeft}
            variant="sunken"
            accessibilityLabel={t('rental.form.prevMonth')}
            disabled={!canGoBack}
            onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          />
          <Text className="font-onest-bold text-base text-ink capitalize">
            {month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
          </Text>
          <IconButton
            icon={ChevronRight}
            variant="sunken"
            accessibilityLabel={t('rental.form.nextMonth')}
            onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          />
        </View>

        <View className="flex-row">
          {weekDays.map((label) => (
            <Text key={label} className="flex-1 text-center font-onest-medium text-xs text-muted capitalize">
              {label}
            </Text>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {cells.map((day, i) => {
            if (!day) return <View key={`e${i}`} className="w-[14.2857%] h-11" />;
            const disabled = !!minDate && day < minDate;
            const edge = day === start || day === shownEnd;
            const inside = !!start && !!shownEnd && day > start && day < shownEnd;
            return (
              <Pressable
                key={day}
                onPress={() => pick(day)}
                disabled={disabled}
                className="w-[14.2857%] h-11 items-center justify-center"
                accessibilityRole="button"
                accessibilityState={{ selected: edge, disabled }}
                accessibilityLabel={formatLocalDate(day, i18n.language)}
              >
                <View
                  className={cn(
                    'w-10 h-10 rounded-full items-center justify-center',
                    edge ? 'bg-primary' : inside ? 'bg-accent' : day === today ? 'bg-sunken' : '',
                  )}
                >
                  <Text
                    className={cn(
                      'font-onest-semibold text-[15px]',
                      edge ? 'text-on-primary' : inside ? 'text-on-accent' : disabled ? 'text-muted' : 'text-ink',
                    )}
                  >
                    {fromLocalDate(day).getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text className="font-onest text-[13px] text-soft text-center">{summary}</Text>
        <Text className="font-onest text-xs text-muted text-center -mt-2">{t('rental.form.returnByHint')}</Text>
        <Button variant="accent" size="lg" full disabled={!start} onPress={done}>
          {t('rental.form.done')}
        </Button>
      </View>
    </Sheet>
  );
}
