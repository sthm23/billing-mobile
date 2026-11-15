import { Button, IconButton, Pressable, Text } from '@/components/base';
import { Sheet } from '@/components/base/Sheet';
import { cn } from '@/libs/utils';
import {
  formatLocalDay,
  formatMonth,
  monthGrid,
  monthStart,
  toLocalDate,
  weekDayLabels,
} from '@/screens/rental/rental-format';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface DatePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Picked day, YYYY-MM-DD; null — nothing yet (the grid opens on today) */
  value: string | null;
  /** Earliest / latest day that can be picked, YYYY-MM-DD */
  min?: string;
  max?: string;
  onPick: (day: string) => void;
}

/**
 * One day on a month grid in a bottom sheet (design «Новый долг — дата»):
 * tap a day, then «Выбрать …». Days outside `min`/`max` are dimmed.
 */
export function DatePickerSheet({ isOpen, onClose, title, subtitle, value, min, max, onPick }: DatePickerSheetProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const today = toLocalDate(new Date());
  const [day, setDay] = useState<string | null>(value);
  const [month, setMonth] = useState(monthStart(value ?? today));

  // Each opening starts from the current value
  useEffect(() => {
    if (!isOpen) return;
    setDay(value);
    setMonth(monthStart(value ?? today));
  }, [isOpen, value, today]);

  const shiftMonth = (step: number) => {
    const [y, m] = month.split('-').map(Number);
    setMonth(toLocalDate(new Date(y, m - 1 + step, 1)));
  };
  const canGoBack = !min || month > monthStart(min);
  const canGoNext = !max || month < monthStart(max);

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-2 pb-8 gap-3">
        <View className="gap-0.5 px-0.5">
          <Text className="type-title text-ink" accessibilityRole="header">{title}</Text>
          {subtitle ? <Text className="font-onest text-[13px] text-muted">{subtitle}</Text> : null}
        </View>

        <View className="flex-row items-center justify-between">
          <IconButton
            icon={ChevronLeft}
            variant="sunken"
            size="sm"
            accessibilityLabel={t('datePicker.prevMonth')}
            disabled={!canGoBack}
            onPress={() => shiftMonth(-1)}
          />
          <Text className="font-onest-bold text-base text-ink">{formatMonth(month, lang)}</Text>
          <IconButton
            icon={ChevronRight}
            variant="sunken"
            size="sm"
            accessibilityLabel={t('datePicker.nextMonth')}
            disabled={!canGoNext}
            onPress={() => shiftMonth(1)}
          />
        </View>

        <View className="flex-row">
          {weekDayLabels(lang).map((label) => (
            <Text key={label} className="flex-1 text-center font-onest-semibold text-[11px] uppercase text-muted">
              {label}
            </Text>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {monthGrid(month).map((cell, i) => {
            if (!cell) return <View key={`pad-${i}`} className="w-[14.28%] h-11" />;
            const out = (!!min && cell < min) || (!!max && cell > max);
            const selected = cell === day;
            return (
              <View key={cell} className="w-[14.28%] p-px">
                <Pressable
                  onPress={() => setDay(cell)}
                  disabled={out}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: out }}
                  accessibilityLabel={formatLocalDay(cell, lang)}
                  className={cn(
                    'h-10 rounded-md items-center justify-center',
                    selected && 'bg-primary',
                    !selected && cell === today && 'border-2 border-accent',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm tabular-nums',
                      selected ? 'font-onest-bold text-on-primary' : 'font-onest-medium text-ink',
                    )}
                  >
                    {Number(cell.slice(8))}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <Button variant="accent" size="lg" full disabled={!day} onPress={() => day && onPick(day)}>
          {day ? t('datePicker.pick', { date: formatLocalDay(day, lang) }) : t('datePicker.pickDay')}
        </Button>
      </View>
    </Sheet>
  );
}
