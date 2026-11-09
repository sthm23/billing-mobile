import { Avatar, AvatarFallbackText, Button, Chip, IconButton, ListCard, SearchField, Text } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useDebounce } from '@/hooks/use-debounce';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useWorkingWarehouse } from '@/hooks/use-working-warehouse';
import { cn } from '@/libs/utils';
import { StaffRole, UserRole } from '@/models/user.model';
import { useAuth } from '@/provider/AuthProvider';
import { DEBOUNCE_TIME_MS } from '@/services/product/product.queries';
import { useStaffList, useStoreById, type StaffListItem } from '@/services/store';
import { router } from 'expo-router';
import { ChevronLeft, CircleAlert, Plus, ShieldX, UsersRound } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { roleLabel, warehousesLabel } from './staff-format';

/** Role chips of the list (design «Сотрудники»); the owner shows under «Все» only. */
const FILTER_ROLES = [StaffRole.SELLER, StaffRole.CASHIER, StaffRole.MANAGER] as const;

/**
 * «Сотрудники» (OWNER only): employees of the store with counters, search and
 * role chips; «Добавить» opens the new-employee form, a row — the card.
 * Filtering and counts come from the backend.
 */
export function StaffListScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isOwner = user?.role === UserRole.OWNER;
  const storeId = user?.staff?.storeId;

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<StaffRole | undefined>(undefined);
  const debouncedSearch = useDebounce(search, DEBOUNCE_TIME_MS);
  const working = useWorkingWarehouse();
  const query = useStaffList(
    { search: debouncedSearch.trim() || undefined, role, warehouseId: working.warehouseId },
    { enabled: isOwner && working.isReady }
  );
  const { data: store } = useStoreById(isOwner ? storeId : undefined);
  const refreshControl = useRefreshControl(query.refetch);
  const data = query.data;

  const header = (
    <View className="flex-row items-center gap-2.5">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" accessibilityRole="header">{t('staff.title')}</Text>
        {store ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {working.warehouse
              ? `${store.name} · ${working.warehouse.name}`
              : t('staff.storeSubtitle', { store: store.name, count: store.warehouse.filter((w) => w.isActive).length })}
          </Text>
        ) : null}
      </View>
      {isOwner ? (
        <Button icon={Plus} onPress={() => router.push('/(tabs)/(profile)/staff/create')}>
          {t('staff.add')}
        </Button>
      ) : null}
    </View>
  );

  if (!isOwner) {
    return (
      <View className="flex-1 bg-bg">
        <View className="px-4 pt-2 pb-3">{header}</View>
        <EmptyState icon={ShieldX} message={t('staff.noAccess')} />
      </View>
    );
  }

  const openCard = (staff: StaffListItem) =>
    router.push({ pathname: '/(tabs)/(profile)/staff/[id]', params: { id: staff.id } });

  const chips = data
    ? [
        { key: 'all', label: t('staff.filterAll', { count: data.counts.total }), value: undefined },
        ...FILTER_ROLES.map((r) => ({
          key: r,
          label: t(`staff.filter.${r}`, { count: data.counts.byRole[r] ?? 0 }),
          value: r,
        })),
      ]
    : [];

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-2 pb-3 gap-3">
        {header}
        {data ? (
          <View className="bg-hero rounded-2xl p-4 flex-row gap-2">
            <View className="flex-1 gap-0.5">
              <Text className="font-onest-bold text-[26px] text-hero-ink">{data.counts.total}</Text>
              <Text className="font-onest text-xs text-hero-muted">{t('staff.total')}</Text>
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-onest-bold text-[26px] text-accent">{data.counts.active}</Text>
              <Text className="font-onest text-xs text-hero-muted">{t('staff.active')}</Text>
            </View>
          </View>
        ) : null}
        <SearchField value={search} onChangeText={setSearch} placeholder={t('staff.search')} />
        {chips.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {chips.map((chip) => (
              <Chip key={chip.key} label={chip.label} selected={role === chip.value} onPress={() => setRole(chip.value)} />
            ))}
          </ScrollView>
        ) : null}
      </View>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError && !data ? (
        <EmptyState icon={CircleAlert} message={t('staff.loadFailed')} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(staff) => staff.id}
          renderItem={({ item }) => (
            <ListCard
              leading={
                <Avatar tone={item.isOwner ? 'accent' : 'sunken'}>
                  <AvatarFallbackText>{item.fullName}</AvatarFallbackText>
                </Avatar>
              }
              title={item.fullName}
              subtitle={`${roleLabel(item.role, t)} · ${warehousesLabel(item, t)}`}
              badge={
                item.isActive
                  ? { label: t('staff.statusActive'), tone: 'ok' }
                  : { label: t('staff.statusInactive'), tone: 'neutral' }
              }
              className={cn(!item.isActive && 'opacity-70')}
              onPress={() => openCard(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={UsersRound}
              message={debouncedSearch ? t('staff.notFound') : role ? t('staff.emptyRole') : t('staff.empty')}
            />
          }
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 8 }}
        />
      )}
    </View>
  );
}
