import { useWorkingWarehouse } from '@/hooks/use-working-warehouse';
import { Button, HeroCard, IconButton, Pressable, Segmented, Spinner, Text } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useBottomNavInset } from '@/components/navigation/BottomNav';
import { useTheme } from '@/hooks/use-theme';
import { formatLocalDay } from '@/screens/rental/rental-format';
import { useOrdersInfinite, useTodaySalesSummary } from '@/services/order/order.queries';
import { OrderParams } from '@/services/order/order.type';
import { router } from 'expo-router';
import { CircleAlert, Plus, ReceiptText, SlidersHorizontal, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, View } from 'react-native';
import { OrderCard } from './OrderCard';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { NavModeSwitch } from '@/components/navigation/NavModeSwitch';
import { OrderFilterSheet } from './filter/OrderFilterSheet';
import {
    activeFilterCount,
    EMPTY_FILTER,
    filterParams,
    periodDays,
    type OrderFilter,
    type OrderTab,
} from './filter/order-filter';

const PAGE_SIZE = 20;

export default function OrderPage() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const colors = useTheme();
    const bottomInset = useBottomNavInset();
    const [tab, setTab] = useState<OrderTab>('active');
    const [filter, setFilter] = useState<OrderFilter>(EMPTY_FILTER);
    const [filterOpen, setFilterOpen] = useState(false);

    const tabOptions: { value: OrderTab; label: string }[] = [
        { value: 'active', label: t('order.activeTab') },
        { value: 'completed', label: t('order.completedTab') },
    ];

    const working = useWorkingWarehouse();
    const listParams = useMemo<Omit<OrderParams, 'currentPage'>>(
        () => ({ pageSize: PAGE_SIZE, warehouseId: working.warehouseId, ...filterParams(filter, tab) }),
        [filter, tab, working.warehouseId],
    );

    const list = useOrdersInfinite(listParams, working.isReady);
    const summary = useTodaySalesSummary(working.warehouseId, working.isReady);
    const refreshControl = useRefreshControl(() => Promise.all([list.refetch(), summary.refetch()]));

    const orders = list.data?.pages.flatMap((p) => p.data) ?? [];
    const count = activeFilterCount(filter);

    // Statuses differ per tab: switching drops the status filter, period and customer stay
    const changeTab = (next: OrderTab) => {
        setTab(next);
        setFilter((f) => ({ ...f, statuses: [] }));
    };

    // Active filters as removable chips under the tabs
    const days = periodDays(filter);
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (days && filter.period) {
        chips.push({
            key: 'period',
            label:
                filter.period === 'custom'
                    ? days.first === days.last
                        ? formatLocalDay(days.first, lang)
                        : `${formatLocalDay(days.first, lang)} – ${formatLocalDay(days.last, lang)}`
                    : t(`orderFilter.periods.${filter.period}`),
            clear: () => setFilter((f) => ({ ...f, period: null, from: null, to: null })),
        });
    }
    if (filter.customer) {
        chips.push({ key: 'customer', label: filter.customer.fullName, clear: () => setFilter((f) => ({ ...f, customer: null })) });
    }
    filter.statuses.forEach((s) =>
        chips.push({
            key: `status-${s}`,
            label: t(`orderFilter.statuses.${s}`),
            clear: () => setFilter((f) => ({ ...f, statuses: f.statuses.filter((x) => x !== s) })),
        }),
    );

    const handleOrderPress = (orderId: string) => {
        router.push(`/(tabs)/(orders)/${orderId}`);
    };

    return (
        <View className="flex-1 bg-bg">
            <View className="px-4 pt-2 pb-3 gap-3">
                {/* Store with sales and rental: switch to the bookings */}
                <NavModeSwitch />
                <View className="flex-row items-center justify-between">
                    <Text className="type-title text-ink" accessibilityRole="header">{t('navigation.orders')}</Text>
                    <Button variant="primary" icon={Plus} onPress={() => router.push('/(tabs)/(orders)/create')}>
                        {t('order.create')}
                    </Button>
                </View>
                {/* Hidden until loaded and on error — the list stays usable */}
                {summary.data && (
                    <HeroCard
                        label={t('order.summary.today')}
                        chip={t('order.summary.count', { count: summary.data.count })}
                        amount={summary.data.total}
                        currency={t('common.currency')}
                        tiles={[
                            { label: t('order.summary.paid'), value: summary.data.paid, tone: 'accent' },
                            { label: t('order.summary.debt'), value: summary.data.debt, tone: 'err' },
                        ]}
                    />
                )}
                <View className="flex-row items-center gap-2">
                    <Segmented options={tabOptions} value={tab} onChange={changeTab} className="flex-1" />
                    <View>
                        <IconButton
                            icon={SlidersHorizontal}
                            variant={count ? 'primary' : undefined}
                            accessibilityLabel={count ? t('orderFilter.buttonActive', { count }) : t('common.filter')}
                            onPress={() => setFilterOpen(true)}
                        />
                        {count ? (
                            <View className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-pill bg-accent items-center justify-center">
                                <Text className="font-onest-bold text-[11px] text-on-accent">{count}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>
                {chips.length ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {chips.map((c) => (
                            <Pressable
                                key={c.key}
                                onPress={c.clear}
                                accessibilityRole="button"
                                accessibilityLabel={t('orderFilter.removeChip', { label: c.label })}
                                className="h-8 pl-3 pr-2 rounded-pill bg-card flex-row items-center gap-1"
                            >
                                <Text className="font-onest-semibold text-xs text-ink" numberOfLines={1}>{c.label}</Text>
                                <X size={14} color={colors.muted} strokeWidth={2} />
                            </Pressable>
                        ))}
                    </ScrollView>
                ) : null}
            </View>

            {list.isError ? (
                <EmptyState icon={CircleAlert} message={t('order.errorLoading')} />
            ) : list.isLoading ? (
                <LoadingState />
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <OrderCard order={item} onPress={handleOrderPress} t={t} />}
                    onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={list.isFetchingNextPage ? <Spinner size="sm" className="py-3" /> : null}
                    ListEmptyComponent={
                        count ? (
                            <EmptyState icon={SlidersHorizontal} message={t('orderFilter.empty')}>
                                <Button variant="secondary" onPress={() => setFilter(EMPTY_FILTER)}>
                                    {t('orderFilter.reset')}
                                </Button>
                            </EmptyState>
                        ) : (
                            <EmptyState icon={ReceiptText} message={t('order.noOrders')} />
                        )
                    }
                    refreshControl={refreshControl}
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: bottomInset, gap: 8 }}
                />
            )}

            <OrderFilterSheet
                isOpen={filterOpen}
                onClose={() => setFilterOpen(false)}
                tab={tab}
                value={filter}
                onApply={(next) => {
                    setFilter(next);
                    setFilterOpen(false);
                }}
            />
        </View>
    );
}
