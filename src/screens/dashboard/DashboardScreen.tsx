import { Button, Chip, HeroCard, IconButton, Money, Pressable, Text } from '@/components/base';
import { DatePickerSheet, EmptyState, LoadingState } from '@/components/common';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { useWorkingWarehouse } from '@/hooks/use-working-warehouse';
import { formatMoney } from '@/libs/format';
import { canSeeDashboard } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import { formatLocalDay, formatLocalDays, toLocalDate } from '@/screens/rental/rental-format';
import { useDashboardSummary, type DashboardSummary } from '@/services/dashboard';
import { router } from 'expo-router';
import { CalendarDays, ChartColumn, ChevronDown, ChevronLeft, CircleAlert, Lock } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, type ChartBar } from './BarChart';
import {
  DASHBOARD_PERIODS,
  DEFAULT_PERIOD,
  barWidth,
  hourRange,
  maxCustomTo,
  minCustomFrom,
  periodDays,
  periodParams,
  salonDay,
  salonHour,
  shortAmount,
  type DashboardPeriod,
  type DashboardPeriodKey,
} from './dashboard-period';
import { DashboardMore } from './DashboardMore';
import { SectionCard, ShareBar, StatTile, TotalRow } from './DashboardParts';
import { DashboardWarehouseSheet } from './DashboardWarehouseSheet';

type Picker = 'none' | 'from' | 'to' | 'warehouse';

/** Four evenly spread axis labels of the chart. */
function axisIndexes(length: number): number[] {
  if (length <= 1) return [0];
  const last = length - 1;
  return [...new Set([0, Math.round(last / 3), Math.round((last * 2) / 3), last])];
}

/**
 * Owner dashboard (design «Дашборд», plan billing/docs/dashboard/PLAN.md):
 * period + warehouse filter, revenue and profit, sales chart, payment methods,
 * cash flow, top products, debts. Every figure comes from `GET /dashboard/summary`.
 */
export function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { user } = useAuth();
  const owner = canSeeDashboard(user);
  const working = useWorkingWarehouse();
  const [period, setPeriod] = useState<DashboardPeriod>(DEFAULT_PERIOD);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [picker, setPicker] = useState<Picker>('none');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Open «Показать ещё» blocks stay open when the period or warehouse changes
  const [moreOpened, setMoreOpened] = useState(0);

  const today = toLocalDate(new Date());
  const days = periodDays(period, today);
  const params = days ? periodParams(days, warehouseId) : { from: '', to: '' };
  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } = useDashboardSummary(
    params,
    owner && days !== null,
  );
  const refreshControl = useRefreshControl(refetch);

  const warehouse = working.warehouses.find((w) => w.id === warehouseId);
  const scopeLabel = warehouse?.name ?? t('dashboard.allWarehouses');
  const storeName = user?.staff?.store?.name;

  const choosePeriod = (key: DashboardPeriodKey) => {
    setSelectedKey(null);
    if (key === 'custom') {
      setPeriod({ key, from: period.key === 'custom' ? period.from : null, to: period.key === 'custom' ? period.to : null });
      if (period.key !== 'custom' || !period.from) setPicker('from');
      return;
    }
    setPeriod({ key, from: null, to: null });
  };

  if (!owner) {
    return (
      <View className="flex-1 bg-bg">
        <Header title={t('dashboard.title')} />
        <EmptyState icon={Lock} message={t('dashboard.noAccess')} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <Header
        title={t('dashboard.title')}
        subtitle={storeName ? `${storeName} · ${scopeLabel}` : scopeLabel}
        right={
          working.warehouses.length > 1 ? (
            <Pressable
              onPress={() => setPicker('warehouse')}
              accessibilityRole="button"
              accessibilityLabel={`${t('dashboard.warehouseTitle')}: ${scopeLabel}`}
              className="h-11 max-w-[150px] px-3.5 rounded-full bg-card flex-row items-center gap-1.5"
            >
              <Text className="flex-shrink font-onest-semibold text-[13px] text-ink" numberOfLines={1}>
                {scopeLabel}
              </Text>
              <ChevronDown size={16} color={colors.ink} strokeWidth={2} />
            </Pressable>
          ) : null
        }
      />

      <ScrollView
        refreshControl={refreshControl}
        // One prop only: on native contentContainerStyle replaces contentContainerClassName
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {DASHBOARD_PERIODS.map((key) => (
            <Chip
              key={key}
              label={t(`dashboard.periods.${key}`)}
              selected={period.key === key}
              onPress={() => choosePeriod(key)}
            />
          ))}
        </ScrollView>

        {period.key === 'custom' ? (
          <View className="gap-1.5">
            <View className="flex-row gap-2">
              {(['from', 'to'] as const).map((field) => {
                const value = period[field];
                const label = t(`dashboard.${field}`);
                return (
                  <Pressable
                    key={field}
                    onPress={() => setPicker(field)}
                    disabled={field === 'to' && !period.from}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}: ${value ? formatLocalDay(value, lang) : t('dashboard.pickDay')}`}
                    className="flex-1 h-14 rounded-2xl bg-card px-3.5 flex-row items-center gap-2"
                  >
                    <View className="flex-1 min-w-0 gap-0.5">
                      <Text className="font-onest-semibold text-xs text-soft">{label}</Text>
                      <Text
                        className={cn('text-[15px]', value ? 'font-onest-bold text-ink' : 'font-onest-medium text-muted')}
                        numberOfLines={1}
                      >
                        {value ? formatLocalDay(value, lang) : t('dashboard.pickDay')}
                      </Text>
                    </View>
                    <CalendarDays size={18} color={colors.muted} strokeWidth={2} />
                  </Pressable>
                );
              })}
            </View>
            <Text className="font-onest text-xs text-muted px-0.5">{t('dashboard.maxDays')}</Text>
          </View>
        ) : null}

        {!days ? (
          <EmptyState card icon={CalendarDays} message={t('dashboard.pickPeriod')} />
        ) : isLoading && !data ? (
          <View className="py-16">
            <LoadingState />
          </View>
        ) : isError && !data ? (
          <EmptyState card icon={CircleAlert} message={t('dashboard.loadFailed')}>
            <Button variant="secondary" onPress={() => void refetch()}>
              {t('dashboard.retry')}
            </Button>
          </EmptyState>
        ) : data ? (
          <View className={cn('gap-3', isFetching && isPlaceholderData && 'opacity-60')}>
            <Summary
              data={data}
              periodLabel={formatLocalDays(days.first, days.last, lang)}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
            />
            <DashboardMore params={params} opened={moreOpened} onOpen={setMoreOpened} />
          </View>
        ) : null}
      </ScrollView>

      <DashboardWarehouseSheet
        isOpen={picker === 'warehouse'}
        onClose={() => setPicker('none')}
        warehouses={working.warehouses}
        value={warehouseId}
        onPick={(id) => {
          setWarehouseId(id);
          setSelectedKey(null);
          setPicker('none');
        }}
      />
      <DatePickerSheet
        isOpen={picker === 'from'}
        onClose={() => setPicker('none')}
        title={t('dashboard.from')}
        value={period.from}
        min={minCustomFrom(period.to)}
        max={period.to ?? today}
        onPick={(day) => {
          setSelectedKey(null);
          setPeriod({ key: 'custom', from: day, to: period.to });
          // Ask for the end right away on a new period
          setPicker(period.to ? 'none' : 'to');
        }}
      />
      <DatePickerSheet
        isOpen={picker === 'to'}
        onClose={() => setPicker('none')}
        title={t('dashboard.to')}
        subtitle={t('dashboard.maxDays')}
        value={period.to}
        min={period.from ?? undefined}
        max={maxCustomTo(period.from, today)}
        onPick={(day) => {
          setSelectedKey(null);
          setPeriod({ key: 'custom', from: period.from, to: day });
          setPicker('none');
        }}
      />
    </View>
  );
}

function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { t } = useTranslation();

  return (
    <View className="px-4 pt-2 pb-3 flex-row items-center gap-2.5">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Cards of the main block. Display only: every number is from the backend. */
function Summary({
  data,
  periodLabel,
  selectedKey,
  onSelect,
}: {
  data: DashboardSummary;
  periodLabel: string;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const { t } = useTranslation();
  const { kpi, cashflow, payments, debts } = data;
  const empty =
    kpi.orders === 0 &&
    kpi.returns === 0 &&
    cashflow.income === 0 &&
    cashflow.expensesTotal === 0 &&
    cashflow.purchase === 0;
  const currency = t('common.currency');

  return (
    <>
      <HeroCard
        label={t('dashboard.revenueOf', { period: periodLabel })}
        amount={kpi.revenue}
        currency={currency}
      >
        {kpi.returns > 0 ? (
          <Text className="font-onest text-xs text-hero-muted -mt-2">
            {t('dashboard.salesMinusReturns', { sales: formatMoney(kpi.sales), returns: formatMoney(kpi.returns) })}
          </Text>
        ) : null}
        <View className="flex-row gap-2">
          <HeroTile
            label={t('dashboard.profit')}
            value={shortAmount(kpi.profit, t)}
            note={kpi.margin !== null ? t('dashboard.margin', { value: Math.round(kpi.margin * 100) }) : undefined}
            accent
          />
          <HeroTile
            label={t('dashboard.orders')}
            value={formatMoney(kpi.orders)}
            note={t('dashboard.itemsSold', { n: formatMoney(kpi.items) })}
          />
          <HeroTile label={t('dashboard.avgCheck')} value={shortAmount(kpi.avgCheck, t)} note={currency} />
        </View>
      </HeroCard>

      {empty ? (
        <EmptyState card icon={ChartColumn} message={t('dashboard.empty')} />
      ) : (
        <>
          <SalesChart data={data} selectedKey={selectedKey} onSelect={onSelect} />

          <SectionCard
            title={t('dashboard.paymentsTitle')}
            note={t('dashboard.received', { value: shortAmount(payments.received, t) })}
          >
            {payments.byType.map((p) => {
              const max = Math.max(...payments.byType.map((x) => x.amount));
              const share = payments.received > 0 ? Math.round((p.amount / payments.received) * 100) : 0;
              return (
                <ShareBar
                  key={p.type}
                  label={t(`order.paymentMethod.${p.type}`)}
                  value={shortAmount(p.amount, t)}
                  note={`· ${share}%`}
                  width={barWidth(p.amount, max)}
                />
              );
            })}
            <TotalRow
              label={t('dashboard.debtGiven')}
              value={`${formatMoney(payments.debtGiven)} ${currency}`}
              tone={payments.debtGiven > 0 ? 'err' : 'default'}
            />
          </SectionCard>

          <SectionCard title={t('dashboard.cashflowTitle')}>
            <View className="flex-row gap-2">
              <StatTile label={t('dashboard.income')} value={`+${shortAmount(cashflow.income, t)}`} tone="ok" />
              <StatTile
                label={t('dashboard.expenses')}
                value={cashflow.expensesTotal > 0 ? `−${shortAmount(cashflow.expensesTotal, t)}` : '0'}
                tone="err"
              />
            </View>
            {cashflow.expenses.length > 0 ? (
              cashflow.expenses.map((e) => (
                <ShareBar
                  key={e.category}
                  label={t(`payment.category.${e.category}`)}
                  value={shortAmount(e.amount, t)}
                  width={barWidth(e.amount, cashflow.expenses[0].amount)}
                  muted
                />
              ))
            ) : (
              <Text className="font-onest text-[13px] text-muted">{t('dashboard.noExpenses')}</Text>
            )}
            <TotalRow
              label={t('dashboard.purchase')}
              value={cashflow.purchase > 0 ? `−${formatMoney(cashflow.purchase)} ${currency}` : `0 ${currency}`}
            />
            <TotalRow
              label={t('dashboard.net')}
              value={`${formatMoney(cashflow.net, { signed: true })} ${currency}`}
              tone={cashflow.net < 0 ? 'err' : 'default'}
            />
          </SectionCard>

          <TopProducts data={data} />

          <SectionCard
            title={t('dashboard.debtsTitle')}
            action={
              <Pressable onPress={() => router.push('/(tabs)/(profile)/debtors')} accessibilityRole="link" hitSlop={8}>
                <Text className="font-onest-semibold text-[13px] text-soft">{t('dashboard.allDebtors')}</Text>
              </Pressable>
            }
          >
            <View className="flex-row gap-2">
              <StatTile label={t('dashboard.debtIssued')} value={shortAmount(debts.given, t)} tone="err" />
              <StatTile label={t('dashboard.debtRepaid')} value={shortAmount(debts.repaid, t)} tone="ok" />
              {debts.outstandingNow !== null ? (
                <StatTile label={t('dashboard.debtNow')} value={shortAmount(debts.outstandingNow, t)} />
              ) : null}
            </View>
          </SectionCard>
        </>
      )}
    </>
  );
}

function HeroTile({ label, value, note, accent = false }: { label: string; value: string; note?: string; accent?: boolean }) {
  return (
    <View className="flex-1 min-w-0 bg-hero-sub rounded-md px-3 py-2.5 gap-0.5">
      <Text className="font-onest text-xs text-hero-muted" numberOfLines={1}>
        {label}
      </Text>
      <Text
        className={cn('font-onest-bold text-[15px]', accent ? 'text-accent' : 'text-hero-ink')}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {note ? (
        <Text className="font-onest text-[11px] text-hero-muted" numberOfLines={1}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

/** Sales by day (or by hour for one day); tap a bar to see its amount. */
function SalesChart({
  data,
  selectedKey,
  onSelect,
}: {
  data: DashboardSummary;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const hourly = data.period.granularity === 'hour';
  const points = data.chart;
  const best = points.reduce<(typeof points)[number] | null>((m, p) => (!m || p.sales > m.sales ? p : m), null);
  const selected = points.find((p) => p.at === selectedKey) ?? best;
  const pointLabel = (at: string) =>
    hourly ? hourRange(salonHour(at)) : formatLocalDay(salonDay(at), i18n.language);
  const bars: ChartBar[] = points.map((p) => ({
    key: p.at,
    value: p.sales,
    accessibilityLabel: `${pointLabel(p.at)}: ${formatMoney(p.sales)} ${t('common.currency')}`,
  }));
  const axis = axisIndexes(points.length).map((i) =>
    hourly ? `${salonHour(points[i].at)}:00` : String(Number(salonDay(points[i].at).slice(8))),
  );

  return (
    <SectionCard title={t(hourly ? 'dashboard.salesByHour' : 'dashboard.salesByDay')} note={t('dashboard.tapBar')}>
      {selected ? (
        <View className="flex-row items-end justify-between gap-3 min-h-10">
          <View className="flex-shrink gap-0.5">
            <Text className="font-onest text-xs text-muted">{pointLabel(selected.at)}</Text>
            <Money value={selected.sales} className="text-[18px] text-ink" />
          </View>
          <Text className="font-onest text-xs text-muted">
            {t('dashboard.ordersCount', { n: selected.orders })}
          </Text>
        </View>
      ) : null}
      <BarChart bars={bars} selectedKey={selected?.at ?? null} onSelect={onSelect} axis={axis} />
      {best && best.sales > 0 ? (
        <Text className="font-onest text-xs text-muted">
          {t('dashboard.maxNote', { value: formatMoney(best.sales) })}
        </Text>
      ) : null}
    </SectionCard>
  );
}

function TopProducts({ data }: { data: DashboardSummary }) {
  const { t } = useTranslation();

  return (
    <SectionCard title={t('dashboard.topTitle')} note={t('dashboard.topNote')}>
      {data.topProducts.length === 0 ? (
        <Text className="font-onest text-[13px] text-muted">{t('dashboard.noSales')}</Text>
      ) : (
        <View>
          {data.topProducts.map((p, i) => (
            <View
              key={p.productId}
              className={cn('flex-row items-center gap-3 py-2', i > 0 && 'border-t border-line')}
            >
              <View
                className={cn(
                  'w-7 h-7 rounded-full items-center justify-center',
                  i === 0 ? 'bg-accent' : 'bg-sunken',
                )}
              >
                <Text className={cn('font-onest-bold text-[13px]', i === 0 ? 'text-on-accent' : 'text-ink')}>
                  {i + 1}
                </Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="font-onest-semibold text-sm text-ink" numberOfLines={1}>
                  {p.name}
                </Text>
                <Text className="font-onest text-xs text-muted">
                  {t('dashboard.pcs', { n: formatMoney(p.quantity) })}
                </Text>
              </View>
              <Text className="font-onest-bold text-sm text-ink">{shortAmount(p.amount, t)}</Text>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}
