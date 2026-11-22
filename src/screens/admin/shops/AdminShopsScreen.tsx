import { Button, Chip, IconButton, Pressable, SearchField, Spinner, Text } from '@/components/base';
import { StatusBadge } from '@/components/base/StatusBadge';
import { SafeAreaView } from '@/components/base/SafeAreaView';
import { EmptyState } from '@/components/common';
import { useDebounce } from '@/hooks/use-debounce';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { isAdmin } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import {
  useAdminStoresInfinite,
  type AdminStoreCounts,
  type AdminStoreListItem,
  type StoreMode,
  type StoreStatus,
} from '@/services/admin-store';
import { DEBOUNCE_TIME_MS } from '@/services/product/product.queries';
import { router } from 'expo-router';
import { ChevronLeft, Plus, Search, ShieldX, Store, WifiOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shopInitials, shopListTerm, shopModes, shopStatusBadge, shortName } from './shop-format';

const STATUS_FILTERS: (StoreStatus | undefined)[] = [undefined, 'ACTIVE', 'TRIAL', 'SUSPENDED'];
const MODES: StoreMode[] = ['sale', 'rent'];
const SKELETONS = [1, 2, 3, 4, 5];

function countOf(counts: AdminStoreCounts | undefined, status: StoreStatus | undefined): string {
  if (!counts) return '·';
  if (!status) return String(counts.total);

  return String({ ACTIVE: counts.active, TRIAL: counts.trial, SUSPENDED: counts.suspended }[status]);
}

/** Row of the list (design «Магазины»): initials, name + status, owner / warehouses / staff, modes, term */
function ShopRow({ store, onPress }: { store: AdminStoreListItem; onPress: () => void }) {
  const { t } = useTranslation();
  const suspended = store.status === 'SUSPENDED';
  const trial = store.status === 'TRIAL';
  const badge = shopStatusBadge(store, t);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={store.name}
      className={cn('bg-card rounded-[20px] px-3.5 py-3 flex-row gap-3 active:opacity-80', suspended && 'opacity-60')}
    >
      <View
        className={cn(
          'w-11 h-11 rounded-[14px] items-center justify-center',
          suspended ? 'bg-sunken' : trial ? 'bg-info-bg' : 'bg-accent',
        )}
      >
        <Text
          className={cn(
            'font-onest-bold text-[15px]',
            suspended ? 'text-muted' : trial ? 'text-info-fg' : 'text-on-accent',
          )}
        >
          {shopInitials(store.name)}
        </Text>
      </View>
      <View className="flex-1 min-w-0 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 min-w-0 font-onest-bold text-base text-ink" numberOfLines={1}>
            {store.name}
          </Text>
          <StatusBadge label={badge.label} tone={badge.tone} />
        </View>
        <Text className="font-onest text-xs leading-4 text-soft">
          {t('adminShops.rowMeta', {
            owner: store.owner ? shortName(store.owner.fullName) : '—',
            warehouses: store.warehousesCount,
            staff: store.staffCount,
          })}
        </Text>
        <View className="flex-row items-center gap-1.5 flex-wrap">
          {shopModes(store).map((mode) => (
            <View key={mode} className="px-2 py-0.5 rounded-pill bg-sunken">
              <Text className="font-onest-semibold text-[11px] text-soft">{t(`adminShops.mode.${mode}`)}</Text>
            </View>
          ))}
          <View className="flex-1" />
          <Text
            className={cn(
              'font-onest text-[11px]',
              suspended ? 'text-err-fg' : trial ? 'text-info-fg' : 'text-muted',
            )}
          >
            {shopListTerm(store, t)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function ShopSkeleton() {
  return (
    <View className="bg-card rounded-[20px] px-3.5 py-3 flex-row gap-3">
      <View className="w-11 h-11 rounded-[14px] bg-sunken" />
      <View className="flex-1 gap-2 pt-1">
        <View className="flex-row justify-between">
          <View className="w-[45%] h-3.5 rounded-pill bg-sunken" />
          <View className="w-16 h-[18px] rounded-pill bg-sunken" />
        </View>
        <View className="w-[85%] h-2.5 rounded-pill bg-sunken" />
        <View className="w-[30%] h-2.5 rounded-pill bg-sunken" />
      </View>
    </View>
  );
}

/**
 * «Магазины» — platform admin only (Profile → «Магазины»). Summary by status,
 * search by store / owner / phone, status and mode filters, pages of 10.
 * Filtering and counts come from GET /admin/stores.
 */
export function AdminShopsScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const admin = isAdmin(user);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StoreStatus | undefined>(undefined);
  const [mode, setMode] = useState<StoreMode | undefined>(undefined);
  const debouncedSearch = useDebounce(search, DEBOUNCE_TIME_MS).trim();

  const query = useAdminStoresInfinite(
    { search: debouncedSearch || undefined, status, mode },
    admin,
  );
  const refreshControl = useRefreshControl(query.refetch);
  const pages = query.data?.pages;
  const stores = useMemo(() => pages?.flatMap((p) => p.data) ?? [], [pages]);
  const first = pages?.[0];
  const counts = first?.counts;
  const total = first?.total ?? 0;
  const rest = Math.max(total - stores.length, 0);

  const isLoading = query.isLoading;
  const isError = query.isError && !first;
  // No store at all (not just none matching the filters)
  const noStores = !!counts && counts.total === 0 && !debouncedSearch && !mode;
  const filtered = !!debouncedSearch || !!status || !!mode;

  const openCreate = () => router.push('/(tabs)/(profile)/shops/new');
  const openStore = (store: AdminStoreListItem) =>
    router.push({ pathname: '/(tabs)/(profile)/shops/[id]', params: { id: store.id } });
  const resetFilters = () => {
    setSearch('');
    setStatus(undefined);
    setMode(undefined);
  };

  const topBar = (
    <View className="flex-row items-center gap-2.5">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 flex-row gap-0.5 p-[3px] bg-card rounded-pill" accessibilityRole="tablist">
        <View
          className="flex-1 h-[38px] rounded-pill bg-primary items-center justify-center"
          accessibilityRole="tab"
          accessibilityState={{ selected: true }}
        >
          <Text className="font-onest-bold text-sm text-on-primary">{t('adminShops.tabShops')}</Text>
        </View>
        <View
          className="flex-1 h-[38px] rounded-pill flex-row items-center justify-center gap-1.5"
          accessibilityRole="tab"
          accessibilityState={{ selected: false, disabled: true }}
        >
          <Text className="font-onest-semibold text-sm text-muted">{t('adminShops.tabRequests')}</Text>
          <View className="px-[7px] py-0.5 rounded-pill bg-sunken">
            <Text className="font-onest-bold text-[10px] text-muted">{t('adminShops.soon')}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!admin) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-bg">
        <View className="px-4 pt-2 pb-3">{topBar}</View>
        <EmptyState icon={ShieldX} message={t('adminShops.noAccess')} />
      </SafeAreaView>
    );
  }

  const summary = [
    { key: 'total', n: countOf(counts, undefined), label: t('adminShops.sum.total'), className: 'text-hero-ink' },
    { key: 'active', n: countOf(counts, 'ACTIVE'), label: t('adminShops.sum.active'), className: 'text-accent' },
    { key: 'trial', n: countOf(counts, 'TRIAL'), label: t('adminShops.sum.trial'), className: 'text-hero-info' },
    { key: 'suspended', n: countOf(counts, 'SUSPENDED'), label: t('adminShops.sum.suspended'), className: 'text-hero-err' },
  ];

  const header = (
    <View className="gap-3 pb-1">
      {topBar}
      <View className="flex-row items-end gap-2.5">
        <View className="flex-1 gap-0.5">
          <Text className="type-title text-ink" accessibilityRole="header">{t('adminShops.title')}</Text>
          <Text className="font-onest text-[13px] text-muted">
            {isLoading ? t('adminShops.loading') : isError ? t('adminShops.offline') : t('adminShops.total', { count: counts?.total ?? 0 })}
          </Text>
        </View>
        <Button icon={Plus} onPress={openCreate}>{t('adminShops.create')}</Button>
      </View>

      <View className="bg-hero rounded-[24px] p-3.5 flex-row flex-wrap gap-2">
        {summary.map((s) => (
          <View key={s.key} className="flex-row items-baseline gap-2 px-2.5 py-2 rounded-[14px] bg-hero-sub" style={{ width: '48.5%' }}>
            <Text className={cn('font-onest-bold text-2xl tabular-nums', s.className)}>{s.n}</Text>
            <Text className="font-onest text-[13px] text-hero-muted">{s.label}</Text>
          </View>
        ))}
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder={t('adminShops.search')} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {STATUS_FILTERS.map((s) => (
          <Chip
            key={s ?? 'all'}
            label={`${t(`adminShops.filter.${s ?? 'all'}`)} · ${countOf(counts, s)}`}
            selected={status === s}
            onPress={() => setStatus(s)}
          />
        ))}
      </ScrollView>
      <View className="flex-row gap-1.5">
        {MODES.map((m) => {
          const on = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(on ? undefined : m)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              className={cn('h-8 px-3 rounded-pill items-center justify-center', on ? 'bg-primary' : 'border-[1.5px] border-line')}
            >
              <Text className={cn('font-onest-semibold text-xs', on ? 'text-on-primary' : 'text-soft')}>
                {t(`adminShops.mode.${m}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const message = isError
    ? {
        icon: WifiOff,
        title: t('adminShops.errorTitle'),
        text: t('adminShops.errorText'),
        action: <Button onPress={() => void query.refetch()}>{t('adminShops.retry')}</Button>,
      }
    : noStores
      ? {
          icon: Store,
          title: t('adminShops.emptyTitle'),
          text: t('adminShops.emptyText'),
          action: <Button variant="accent" onPress={openCreate}>{t('adminShops.createFirst')}</Button>,
        }
      : {
          icon: Search,
          title: t('adminShops.notFoundTitle'),
          text: debouncedSearch
            ? t('adminShops.notFoundText', { query: debouncedSearch })
            : t('adminShops.notFoundFilters'),
          action: filtered ? <Button onPress={resetFilters}>{t('adminShops.resetSearch')}</Button> : null,
        };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <FlatList
        data={isLoading || isError ? [] : stores}
        keyExtractor={(store) => store.id}
        renderItem={({ item }) => <ShopRow store={item} onPress={() => openStore(item)} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-2" accessibilityLabel={t('adminShops.loading')}>
              {SKELETONS.map((i) => <ShopSkeleton key={i} />)}
            </View>
          ) : (
            <EmptyState card icon={message.icon} message={message.title} description={message.text}>
              {message.action}
            </EmptyState>
          )
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View className="flex-row items-center justify-center gap-2.5 p-3">
              <Spinner size="sm" color={colors.ink} />
              <Text className="font-onest text-[13px] text-muted">
                {t('adminShops.loadingMore', { count: Math.min(rest, 10), total: rest })}
              </Text>
            </View>
          ) : null
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={refreshControl}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 24, gap: 8 }}
      />
    </SafeAreaView>
  );
}
