import { Button, IconButton, SearchField, Spinner, Text } from '@/components/base';
import type { ButtonIconComponent } from '@/components/base';
import { useBottomNavInset } from '@/components/navigation/BottomNav';
import { NavModeSwitch } from '@/components/navigation/NavModeSwitch';
import { useDebounce } from '@/hooks/use-debounce';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import {
  RENTAL_VIEWS,
  RentalStatus,
  useRentalsInfinite,
  useRentalSummary,
  type RentalListItem,
  type RentalView,
} from '@/services/rental';
import { router } from 'expo-router';
import { CalendarDays, CalendarPlus, CloudOff, SearchX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { dayKey, formatDay, OUT_STATUSES, rowDay, viewSort } from './rental-format';
import { RentalRow, RentalRowSkeleton } from './RentalRow';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const OVERDUE_GROUP = 'overdue';

type ListEntry =
  | { kind: 'header'; key: string; title: string; meta: string; err: boolean }
  | { kind: 'row'; key: string; rental: RentalListItem };

/**
 * Rentals tab root (design «Аренда · список»): search, quick filters with
 * counters from the backend, rows grouped by the day they are about.
 */
export function RentalListScreen() {
  const { t, i18n } = useTranslation();
  const bottomInset = useBottomNavInset();
  const [view, setView] = useState<RentalView>('all');
  const [query, setQuery] = useState('');
  const q = useDebounce(query.trim(), SEARCH_DEBOUNCE_MS);

  const params = useMemo(() => ({ pageSize: PAGE_SIZE, view, q: q || undefined, ...viewSort(view) }), [view, q]);
  const list = useRentalsInfinite(params);
  const summary = useRentalSummary();
  const refreshControl = useRefreshControl(() => Promise.all([list.refetch(), summary.refetch()]));

  const rentals = useMemo(() => list.data?.pages.flatMap((page) => page.data) ?? [], [list.data]);

  const entries = useMemo<ListEntry[]>(() => {
    const now = new Date();
    const today = dayKey(now.toISOString());
    const tomorrow = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString());
    const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString());

    // Groups in the order the backend sorted the rows
    const groups = new Map<string, { day: string; rows: RentalListItem[] }>();
    for (const rental of rentals) {
      const day = rowDay(rental);
      const key = rental.overdue ? OVERDUE_GROUP : dayKey(day);
      const group = groups.get(key) ?? { day, rows: [] };
      group.rows.push(rental);
      groups.set(key, group);
    }

    const result: ListEntry[] = [];
    for (const [key, group] of groups) {
      const date = formatDay(group.day, i18n.language);
      const title =
        key === OVERDUE_GROUP
          ? t('rental.group.overdue')
          : key === today
            ? t('rental.group.today', { date })
            : key === tomorrow
              ? t('rental.group.tomorrow', { date })
              : key === yesterday
                ? t('rental.group.yesterday', { date })
                : date;
      const toIssue = group.rows.filter((r) => r.status === RentalStatus.BOOKED).length;
      const toReturn = group.rows.filter((r) => OUT_STATUSES.includes(r.status)).length;
      const closed = group.rows.length - toIssue - toReturn;
      const meta = [
        toIssue ? t('rental.group.toIssue', { count: toIssue }) : null,
        toReturn ? t('rental.group.toReturn', { count: toReturn }) : null,
        closed ? t('rental.group.closed', { count: closed }) : null,
      ]
        .filter(Boolean)
        .join(' · ');
      result.push({ kind: 'header', key: `h-${key}`, title, meta, err: key === OVERDUE_GROUP });
      for (const rental of group.rows) result.push({ kind: 'row', key: rental.id, rental });
    }
    return result;
  }, [rentals, t, i18n.language]);

  const openRental = (id: string) => router.push({ pathname: '/(tabs)/(rentals)/[id]', params: { id } });
  const resetFilters = () => {
    setQuery('');
    setView('all');
  };
  const filtered = view !== 'all' || q.length > 0;

  const renderEmpty = () => {
    if (list.isLoading) {
      return (
        <View className="gap-2 pt-2">
          {[0, 1, 2].map((i) => (
            <RentalRowSkeleton key={i} />
          ))}
        </View>
      );
    }
    if (list.isError) {
      return (
        <MessageCard
          icon={CloudOff}
          tone="err"
          title={t('rental.list.errorTitle')}
          text={t('rental.list.errorText')}
          action={t('rental.list.retry')}
          onAction={() => {
            void list.refetch();
            void summary.refetch();
          }}
        />
      );
    }
    if (filtered) {
      return (
        <MessageCard
          icon={SearchX}
          tone="neutral"
          title={t('rental.list.notFoundTitle')}
          text={
            q
              ? t('rental.list.notFoundQuery', { query: q, filter: t(`rental.view.${view}`) })
              : t('rental.list.notFoundFilter', { filter: t(`rental.view.${view}`) })
          }
          action={t('rental.list.reset')}
          onAction={resetFilters}
        />
      );
    }
    return (
      <MessageCard
        icon={CalendarPlus}
        tone="accent"
        title={t('rental.list.emptyTitle')}
        text={t('rental.list.emptyText')}
        action={t('rental.list.create')}
        onAction={() => router.push('/(tabs)/(rentals)/create')}
      />
    );
  };

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-2 pb-2 gap-3">
        {/* Store with sales and rental: switch to the orders */}
        <NavModeSwitch />
        <View className="flex-row items-center justify-between">
          <Text className="type-title text-ink" accessibilityRole="header">{t('rental.title')}</Text>
          <IconButton
            icon={CalendarDays}
            accessibilityLabel={t('rental.calendar')}
            onPress={() => router.push({ pathname: '/(tabs)/(rentals)/soon', params: { kind: 'calendar' } })}
          />
        </View>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t('rental.list.searchPlaceholder')}
        />
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 gap-2 pb-2"
          keyboardShouldPersistTaps="handled"
        >
          {RENTAL_VIEWS.map((id) => (
            <FilterChip
              key={id}
              label={t(`rental.view.${id}`)}
              count={summary.data?.[id]}
              selected={view === id}
              warn={id === 'overdue'}
              onPress={() => setView(id)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={list.isLoading || list.isError ? [] : entries}
        keyExtractor={(entry) => entry.key}
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <View className="flex-row items-baseline justify-between px-1 pt-2 pb-0.5">
              <Text className={cn('font-onest-bold text-[15px]', item.err ? 'text-err-fg' : 'text-ink')}>
                {item.title}
              </Text>
              <Text className="font-onest text-xs text-muted">{item.meta}</Text>
            </View>
          ) : (
            <RentalRow rental={item.rental} onPress={openRental} />
          )
        }
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={list.isFetchingNextPage ? <Spinner className="py-3" /> : null}
        onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
        onEndReachedThreshold={0.3}
        refreshControl={refreshControl}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 4, paddingBottom: bottomInset, gap: 8 }}
      />
    </View>
  );
}

interface FilterChipProps {
  label: string;
  /** From GET /rental/summary; undefined while loading */
  count: number | undefined;
  selected: boolean;
  /** Red counter when not zero («Просрочено») */
  warn?: boolean;
  onPress: () => void;
}

/** Quick filter with its counter (design «Аренда · список») */
function FilterChip({ label, count, selected, warn = false, onPress }: FilterChipProps) {
  const hot = warn && !!count;

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'h-9 flex-row items-center gap-1.5 rounded-pill pl-3.5 pr-1.5 active:opacity-80',
        selected ? 'bg-primary' : 'bg-card',
      )}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
    >
      <Text className={cn('font-onest-semibold text-sm', selected ? 'text-on-primary' : 'text-ink')}>{label}</Text>
      <View
        className={cn(
          'min-w-6 h-6 px-1.5 rounded-pill items-center justify-center',
          selected ? 'bg-accent' : hot ? 'bg-err-bg' : 'bg-sunken',
        )}
      >
        <Text
          className={cn(
            'font-onest-bold text-xs',
            selected ? 'text-on-accent' : hot ? 'text-err-fg' : 'text-soft',
          )}
        >
          {count === undefined ? '·' : count}
        </Text>
      </View>
    </Pressable>
  );
}

interface MessageCardProps {
  icon: ButtonIconComponent;
  tone: 'accent' | 'err' | 'neutral';
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}

/** Empty / error / not found card of the list */
function MessageCard({ icon: Icon, tone, title, text, action, onAction }: MessageCardProps) {
  const colors = useTheme();
  const plate = { accent: 'bg-accent', err: 'bg-err-bg', neutral: 'bg-sunken' }[tone];
  const iconColor = { accent: colors.onAccent, err: colors.errFg, neutral: colors.soft }[tone];

  return (
    <View className="bg-card rounded-2xl px-6 py-8 items-center gap-3 mt-2">
      <View className={cn('w-[72px] h-[72px] rounded-full items-center justify-center', plate)}>
        <Icon size={32} color={iconColor} strokeWidth={1.8} />
      </View>
      <Text className="font-onest-bold text-lg text-ink text-center">{title}</Text>
      <Text className="font-onest text-sm leading-5 text-muted text-center max-w-[280px]">{text}</Text>
      <Button variant={tone === 'accent' ? 'accent' : 'primary'} onPress={onAction} className="mt-2">
        {action}
      </Button>
    </View>
  );
}
