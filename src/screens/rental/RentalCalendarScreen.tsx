import { useWorkingWarehouse } from '@/hooks/use-working-warehouse';
import { Button, IconButton, Segmented, StatusBadge, Text } from '@/components/base';
import { EmptyState } from '@/components/common';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { useRentalAgenda, type RentalAgenda } from '@/services/rental';
import { router } from 'expo-router';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import {
  addLocalDays,
  formatDay,
  formatLocalDate,
  formatLongDay,
  formatMonth,
  initials,
  monthEnd,
  monthGrid,
  monthStart,
  rentalBadges,
  toLocalDate,
  weekDayLabels,
  weekStart,
} from './rental-format';

type CalendarView = 'month' | 'week';
type AgendaEvent = RentalAgenda['events'][number];

/**
 * «Календарь» of rentals (design «Аренда · календарь», month / week): per day
 * how many bookings to issue (↑) and rentals to take back (↓), and the list of
 * the picked day. Days and counts come from `GET /rental/agenda`.
 */
export function RentalCalendarScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const [view, setView] = useState<CalendarView>('month');
  // Device today until the backend tells the salon one
  const [selected, setSelected] = useState(() => toLocalDate(new Date()));
  /** Any day of the shown period */
  const [anchor, setAnchor] = useState(selected);

  const from = view === 'month' ? monthStart(anchor) : weekStart(anchor);
  const to = view === 'month' ? monthEnd(anchor) : addLocalDays(from, 6);
  const working = useWorkingWarehouse();
  const { data, isLoading, isError, isFetching, refetch } = useRentalAgenda(
    from,
    to,
    working.warehouseId,
    working.isReady
  );
  const refreshControl = useRefreshControl(refetch);
  const today = data?.today ?? toLocalDate(new Date());

  const cells = useMemo(
    () => (view === 'month' ? monthGrid(anchor) : Array.from({ length: 7 }, (_, i) => addLocalDays(from, i))),
    [view, anchor, from],
  );
  const counts = useMemo(() => new Map((data?.days ?? []).map((d) => [d.date, d])), [data]);
  const dayEvents = (data?.events ?? []).filter((e) => e.date === selected);
  const issues = dayEvents.filter((e) => e.kind === 'ISSUE');
  const returns = dayEvents.filter((e) => e.kind === 'RETURN');

  const shift = (step: number) => {
    const next =
      view === 'month'
        ? (() => {
            const [y, m] = anchor.split('-').map(Number);
            return toLocalDate(new Date(y, m - 1 + step, 1));
          })()
        : addLocalDays(from, 7 * step);
    setAnchor(next);
    // Keep the pick inside the shown period: today when it is there, else its first day
    const nextFrom = view === 'month' ? monthStart(next) : weekStart(next);
    const nextTo = view === 'month' ? monthEnd(next) : addLocalDays(nextFrom, 6);
    setSelected(today >= nextFrom && today <= nextTo ? today : nextFrom);
  };

  const changeView = (next: CalendarView) => {
    setView(next);
    setAnchor(selected);
  };

  const period =
    view === 'month' ? formatMonth(from, lang) : `${formatDay(`${from}T12:00:00`, lang)} – ${formatDay(`${to}T12:00:00`, lang)}`;
  const weekDays = weekDayLabels(lang);

  return (
    <View className="flex-1 bg-bg">
      {/* Back + the month / week switch filling the row (the switch says what the screen is) */}
      <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('rental.card.back')} onPress={() => router.back()} />
        <View style={{ flex: 1, minWidth: 0 }} accessibilityRole="header" accessibilityLabel={t('rental.agenda.title')}>
          <Segmented<CalendarView>
            options={[
              { value: 'month', label: t('rental.agenda.month') },
              { value: 'week', label: t('rental.agenda.week') },
            ]}
            value={view}
            onChange={changeView}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
      >
        <View className="bg-card rounded-xl p-3.5 gap-3">
          <View className="flex-row items-center justify-between">
            <IconButton icon={ChevronLeft} variant="sunken" size="sm" accessibilityLabel={t('rental.agenda.prev')} onPress={() => shift(-1)} />
            <View className="flex-row items-center gap-2">
              <Text className="font-onest-bold text-base text-ink">{period}</Text>
              {isFetching && !isLoading ? <ActivityIndicator size="small" color={colors.muted} /> : null}
            </View>
            <IconButton icon={ChevronRight} variant="sunken" size="sm" accessibilityLabel={t('rental.agenda.next')} onPress={() => shift(1)} />
          </View>

          <View className="flex-row">
            {weekDays.map((label, i) => (
              <Text
                key={label}
                className={cn('flex-1 text-center font-onest-semibold text-[11px] uppercase', i > 4 ? 'text-err-fg' : 'text-muted')}
              >
                {label}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {cells.map((day, i) => {
              if (!day) return <View key={`pad-${i}`} className="w-[14.28%] h-[54px]" />;
              const c = counts.get(day);
              const on = day === selected;
              const isToday = day === today;
              return (
                <View key={day} className="w-[14.28%] p-0.5">
                  <Pressable
                    onPress={() => setSelected(day)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={t('rental.agenda.dayA11y', {
                      date: formatLocalDate(day, lang),
                      issues: c?.issues ?? 0,
                      returns: c?.returns ?? 0,
                    })}
                    className={cn(
                      'rounded-md items-center pt-1.5 gap-0.5',
                      view === 'week' ? 'h-[72px]' : 'h-[54px]',
                      on ? 'bg-primary' : isToday ? 'border-2 border-accent' : '',
                      day < today && !on && 'opacity-55',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm tabular-nums',
                        on ? 'text-on-primary' : 'text-ink',
                        on || isToday ? 'font-onest-bold' : 'font-onest-medium',
                      )}
                    >
                      {Number(day.slice(8))}
                    </Text>
                    <View className={cn(view === 'week' ? 'gap-0.5 items-center' : 'flex-row gap-1')}>
                      {c && c.issues > 0 ? (
                        <Text className={cn('font-onest-bold text-[10px]', on ? 'text-on-primary' : 'text-info-fg')}>↑{c.issues}</Text>
                      ) : null}
                      {c && c.returns > 0 ? (
                        <Text className={cn('font-onest-bold text-[10px]', on ? 'text-on-primary' : 'text-warn-fg')}>↓{c.returns}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View className="flex-row flex-wrap gap-x-4 gap-y-1 px-0.5">
            <Text className="font-onest text-xs text-muted">
              <Text className="font-onest-bold text-xs text-info-fg">↑</Text> {t('rental.agenda.legendIssue')}
            </Text>
            <Text className="font-onest text-xs text-muted">
              <Text className="font-onest-bold text-xs text-warn-fg">↓</Text> {t('rental.agenda.legendReturn')}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded-full border-2 border-accent" />
              <Text className="font-onest text-xs text-muted">{t('rental.agenda.legendToday')}</Text>
            </View>
          </View>
        </View>

        {isError && !data ? (
          <EmptyState icon={CircleAlert} message={t('rental.agenda.loadFailed')}>
            <Button variant="primary" onPress={() => void refetch()}>{t('rental.list.retry')}</Button>
          </EmptyState>
        ) : (
          <>
            <View className="flex-row items-baseline justify-between gap-2 px-1">
              <Text className="flex-1 font-onest-bold text-base text-ink">
                {formatLongDay(selected, lang)}
                {selected === today ? ` · ${t('rental.agenda.legendToday')}` : ''}
              </Text>
              <Text className="font-onest text-xs text-muted">
                {t('rental.agenda.daySummary', { issues: issues.length, returns: returns.length })}
              </Text>
            </View>
            {isLoading ? (
              <ActivityIndicator color={colors.muted} className="pt-4" />
            ) : (
              <>
                <DaySection kind="ISSUE" events={issues} />
                <DaySection kind="RETURN" events={returns} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function DaySection({ kind, events }: { kind: 'ISSUE' | 'RETURN'; events: AgendaEvent[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const colors = useTheme();
  const issue = kind === 'ISSUE';
  const Icon = issue ? ArrowUp : ArrowDown;

  return (
    <View className="bg-card rounded-xl p-3.5 gap-2">
      <View className="flex-row items-center gap-2 px-0.5 pb-0.5">
        <View className={cn('w-7 h-7 rounded-sm items-center justify-center', issue ? 'bg-info-bg' : 'bg-warn-bg')}>
          <Icon size={16} color={issue ? colors.infoFg : colors.warnFg} strokeWidth={2.5} />
        </View>
        <Text className="font-onest-bold text-[15px] text-ink">
          {issue ? t('rental.agenda.toIssue') : t('rental.agenda.toReturn')}
        </Text>
        <Text className="font-onest text-[13px] text-muted">· {events.length}</Text>
      </View>
      {events.length === 0 ? (
        <Text className="font-onest text-[13px] text-muted px-0.5 pb-1">
          {issue ? t('rental.agenda.noIssues') : t('rental.agenda.noReturns')}
        </Text>
      ) : (
        events.map(({ rental }) => {
          const name = rental.customer?.fullName ?? t('rental.noCustomer');
          const when = issue
            ? t('rental.agenda.until', { date: formatDay(rental.endDate, lang) })
            : rental.overdue
              ? t('rental.agenda.wasDue', { date: formatDay(rental.endDate, lang) })
              : t('rental.returnBy');
          const badges = rentalBadges(rental, t);
          const badge = badges[badges.length - 1];
          return (
            <Pressable
              key={rental.id}
              onPress={() => router.push({ pathname: '/(tabs)/(rentals)/[id]', params: { id: rental.id } })}
              accessibilityRole="button"
              className="flex-row items-center gap-3 p-2.5 rounded-lg bg-sunken active:opacity-80"
            >
              <View className="w-10 h-10 rounded-full bg-card items-center justify-center">
                <Text className="font-onest-bold text-[13px] text-soft">{initials(name)}</Text>
              </View>
              <View className="flex-1 min-w-0 gap-0.5">
                <Text className="type-body-strong text-ink" numberOfLines={1}>{name}</Text>
                <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                  {[`№${rental.code}`, t('rental.agenda.items', { count: rental.itemCount }), when].join(' · ')}
                </Text>
              </View>
              {badge ? <StatusBadge label={badge.label} tone={badge.tone} /> : null}
            </Pressable>
          );
        })
      )}
    </View>
  );
}
