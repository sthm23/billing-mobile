import { Button, Money, Pressable, Text } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/libs/format';
import {
  useDashboardActivity,
  useDashboardTeam,
  type DashboardActivity,
  type DashboardParams,
  type DashboardTeam,
} from '@/services/dashboard';
import { ChevronDown, CircleAlert } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BarChart, type ChartBar } from './BarChart';
import { barWidth, hourRange, shortAmount } from './dashboard-period';
import { SectionCard, ShareBar, StatTile } from './DashboardParts';

/** «Показать ещё» opens these blocks one by one. */
export const MORE_BLOCKS = 2;

/** Hours shown when nothing sold, and the least window around the selling hours. */
const DEFAULT_FIRST_HOUR = 8;
const DEFAULT_LAST_HOUR = 20;

interface DashboardMoreProps {
  params: DashboardParams;
  /** How many blocks are open (0 … MORE_BLOCKS); kept when the period changes */
  opened: number;
  onOpen: (opened: number) => void;
}

/**
 * Extra reports under the main block (design «Показать ещё отчёты»): block 1 —
 * staff and warehouses, block 2 — hours, returns, rental. Each block is its
 * own request, sent only once the block is open.
 */
export function DashboardMore({ params, opened, onOpen }: DashboardMoreProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const team = useDashboardTeam(params, opened >= 1);
  const activity = useDashboardActivity(params, opened >= 2);

  return (
    <>
      {opened >= 1 ? (
        <>
          <BlockTitle title={t('dashboard.more.teamTitle')} />
          <BlockState query={team}>{(data) => <TeamBlock data={data} />}</BlockState>
        </>
      ) : null}
      {opened >= 2 ? (
        <>
          <BlockTitle title={t('dashboard.more.activityTitle')} />
          <BlockState query={activity}>{(data) => <ActivityBlock data={data} />}</BlockState>
        </>
      ) : null}

      {opened < MORE_BLOCKS ? (
        <Pressable
          onPress={() => onOpen(opened + 1)}
          accessibilityRole="button"
          className="min-h-16 rounded-xl bg-card border-[1.5px] border-track px-4 py-3 flex-row items-center gap-3"
        >
          <View className="w-10 h-10 rounded-full bg-accent items-center justify-center">
            <ChevronDown size={20} color={colors.onAccent} strokeWidth={2.2} />
          </View>
          <View className="flex-1 min-w-0 gap-0.5">
            <Text className="type-body-strong text-ink">{t('dashboard.more.show')}</Text>
            <Text className="font-onest text-xs text-muted" numberOfLines={1}>
              {t(opened === 0 ? 'dashboard.more.hintTeam' : 'dashboard.more.hintActivity')}
            </Text>
          </View>
          <Text className="font-onest-semibold text-xs text-muted">
            {t('dashboard.more.step', { n: opened + 1, total: MORE_BLOCKS })}
          </Text>
        </Pressable>
      ) : (
        <Button variant="ghost" onPress={() => onOpen(0)}>
          {t('dashboard.more.collapse')}
        </Button>
      )}
    </>
  );
}

function BlockTitle({ title }: { title: string }) {
  return (
    <View className="flex-row items-center gap-2.5 pt-3 px-1">
      <Text className="font-onest-bold text-[13px] tracking-[0.8px] uppercase text-muted" accessibilityRole="header">
        {title}
      </Text>
      <View className="flex-1 h-px bg-track" />
    </View>
  );
}

/** Loading / error / data of one block. */
function BlockState<T>({
  query,
  children,
}: {
  query: { data: T | undefined; isLoading: boolean; isError: boolean; refetch: () => Promise<unknown> };
  children: (data: T) => ReactNode;
}) {
  const { t } = useTranslation();

  if (query.data) return <>{children(query.data)}</>;
  if (query.isError) {
    return (
      <EmptyState card icon={CircleAlert} message={t('dashboard.loadFailed')}>
        <Button variant="secondary" onPress={() => void query.refetch()}>
          {t('dashboard.retry')}
        </Button>
      </EmptyState>
    );
  }

  return (
    <View className="py-8">
      <LoadingState />
    </View>
  );
}

function TeamBlock({ data }: { data: DashboardTeam }) {
  const { t } = useTranslation();
  const staffMax = data.staff[0]?.sales ?? 0;
  const warehouseMax = data.warehouses?.[0]?.sales ?? 0;

  return (
    <>
      <SectionCard title={t('dashboard.more.staffTitle')} note={t('dashboard.more.byRevenue')}>
        {data.staff.length === 0 ? (
          <Text className="font-onest text-[13px] text-muted">{t('dashboard.noSales')}</Text>
        ) : (
          data.staff.map((s) => (
            <ShareBar
              key={s.staffId}
              label={`${s.name} · ${t('dashboard.ordersCount', { n: s.orders })}`}
              value={shortAmount(s.sales, t)}
              width={barWidth(s.sales, staffMax)}
            />
          ))
        )}
      </SectionCard>

      {data.warehouses ? (
        <SectionCard title={t('dashboard.more.warehousesTitle')}>
          {data.warehouses.map((w) => (
            <ShareBar
              key={w.warehouseId}
              label={w.name}
              value={shortAmount(w.sales, t)}
              note={`· ${Math.round(w.share * 100)}%`}
              width={barWidth(w.sales, warehouseMax)}
            />
          ))}
        </SectionCard>
      ) : null}
    </>
  );
}

function ActivityBlock({ data }: { data: DashboardActivity }) {
  const { t } = useTranslation();
  const { returns, rental } = data;
  const reasonMax = Math.max(0, ...returns.byReason.map((r) => r.count));

  return (
    <>
      <HoursCard hours={data.hours} />

      <SectionCard title={t('dashboard.more.returnsTitle')}>
        <View className="flex-row gap-2">
          <StatTile
            label={t('dashboard.more.returnsSum')}
            value={shortAmount(returns.amount, t)}
            tone={returns.amount > 0 ? 'err' : 'default'}
          />
          <StatTile label={t('dashboard.more.returnsCount')} value={formatMoney(returns.count)} />
          <StatTile
            label={t('dashboard.more.returnsShare')}
            value={returns.share === null ? '—' : `${(returns.share * 100).toFixed(1).replace('.', ',')}%`}
          />
        </View>
        {returns.count > 0
          ? returns.byReason.map((r) => (
              <ShareBar
                key={r.reason}
                label={t(`orderReturn.reasons.${r.reason}`)}
                value={String(r.count)}
                width={barWidth(r.count, reasonMax)}
                muted
              />
            ))
          : null}
      </SectionCard>

      {rental ? (
        <SectionCard
          title={t('dashboard.more.rentalTitle')}
          note={t('dashboard.more.rentalIncome', { value: shortAmount(rental.income, t) })}
        >
          <View className="flex-row gap-2">
            <StatTile label={t('dashboard.more.rentalOut')} value={t('dashboard.pcs', { n: rental.out })} />
            <StatTile label={t('dashboard.more.rentalToday')} value={t('dashboard.pcs', { n: rental.dueToday })} />
            <StatTile
              label={t('dashboard.more.rentalOverdue')}
              value={t('dashboard.pcs', { n: rental.overdue })}
              tone={rental.overdue > 0 ? 'err' : 'default'}
            />
          </View>
          <Text className="font-onest text-xs text-muted">{t('dashboard.more.rentalNote')}</Text>
        </SectionCard>
      ) : null}
    </>
  );
}

/** Average sales per hour of a day, over the selling hours (at least 8:00–20:00). */
function HoursCard({ hours }: { hours: DashboardActivity['hours'] }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const selling = hours.points.filter((p) => p.orders > 0).map((p) => p.hour);
  const first = Math.min(DEFAULT_FIRST_HOUR, ...selling);
  const last = Math.max(DEFAULT_LAST_HOUR, ...selling);
  const points = hours.points.filter((p) => p.hour >= first && p.hour <= last);
  const current = points.find((p) => p.hour === (selected ?? hours.peakHour)) ?? null;
  const bars: ChartBar[] = points.map((p) => ({
    key: String(p.hour),
    value: p.avgSales,
    accessibilityLabel: `${hourRange(p.hour)}: ${formatMoney(p.avgSales)} ${t('common.currency')}`,
  }));
  const axisHours = [first, Math.round((first * 2 + last) / 3), Math.round((first + last * 2) / 3), last];

  return (
    <SectionCard title={t('dashboard.salesByHour')} note={t('dashboard.more.avgPerDay')}>
      {hours.peakHour === null ? (
        <Text className="font-onest text-[13px] text-muted">{t('dashboard.noSales')}</Text>
      ) : (
        <>
          <Text className="font-onest text-[13px] text-soft">
            {hours.quietHour === null
              ? t('dashboard.more.peakOnly', { peak: hourRange(hours.peakHour) })
              : t('dashboard.more.peak', { peak: hourRange(hours.peakHour), quiet: hourRange(hours.quietHour) })}
          </Text>
          {current ? (
            <View className="flex-row items-end justify-between gap-3">
              <View className="flex-shrink gap-0.5">
                <Text className="font-onest text-xs text-muted">{hourRange(current.hour)}</Text>
                <Money value={current.avgSales} className="text-[18px] text-ink" />
              </View>
              <Text className="font-onest text-xs text-muted">
                {t('dashboard.ordersCount', { n: current.orders })}
              </Text>
            </View>
          ) : null}
          <BarChart
            bars={bars}
            selectedKey={current ? String(current.hour) : null}
            onSelect={(key) => setSelected(Number(key))}
            axis={axisHours.map((h) => `${h}:00`)}
            height={110}
          />
        </>
      )}
    </SectionCard>
  );
}
