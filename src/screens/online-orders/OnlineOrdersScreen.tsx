import { IconButton, ListCard, Segmented, Spinner, Text } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { canHandleOnlineOrders } from '@/libs/roles';
import { useAuth } from '@/provider/AuthProvider';
import {
  ONLINE_ORDER_STATUSES,
  useOnlineOrdersInfinite,
  type OnlineOrderListItem,
  type OnlineOrderStatus,
} from '@/services/telegram-shop';
import { router } from 'expo-router';
import { ChevronLeft, CircleAlert, ShieldX, ShoppingBag } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDateTime, statusBadge } from './online-order-format';

/**
 * Profile → «Онлайн-заявки» (owner, manager, seller): requests customers sent from the
 * store's Telegram shop, by status. A new one needs a call and a decision; tapping it opens
 * the card. Counters come from the backend.
 */
export function OnlineOrdersScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const allowed = canHandleOnlineOrders(user);
  const [status, setStatus] = useState<OnlineOrderStatus>('NEW');
  const list = useOnlineOrdersInfinite(status, allowed);
  const refreshControl = useRefreshControl(list.refetch);

  const items = list.data?.pages.flatMap((page) => page.data) ?? [];
  const counts = list.data?.pages[0]?.counts;

  const header = (
    <View className="px-4 pt-2 pb-3 gap-3">
      <View className="flex-row items-center gap-2.5">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        <Text className="flex-1 type-heading text-ink" accessibilityRole="header">
          {t('onlineOrders.title')}
        </Text>
      </View>
      {allowed ? (
        <Segmented<OnlineOrderStatus>
          options={ONLINE_ORDER_STATUSES.map((value) => ({
            value,
            label: counts ? `${t(`onlineOrders.tab${value}`)} · ${counts[value]}` : t(`onlineOrders.tab${value}`),
          }))}
          value={status}
          onChange={setStatus}
        />
      ) : null}
    </View>
  );

  if (!allowed) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={ShieldX} message={t('onlineOrders.noAccess')} />
      </View>
    );
  }

  const meta = (item: OnlineOrderListItem) => [formatDateTime(item.createdAt), item.regionName].join(' · ');

  return (
    <View className="flex-1 bg-bg">
      {header}
      {list.isLoading ? (
        <LoadingState />
      ) : list.isError && !list.data ? (
        <EmptyState icon={CircleAlert} message={t('onlineOrders.loadFailed')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListCard
              lead={`#${item.number}`}
              title={item.fullName}
              subtitle={meta(item)}
              amount={item.total}
              badge={statusBadge(item.status, t)}
              highlight={item.status === 'NEW'}
              onPress={() => router.push({ pathname: '/(tabs)/(profile)/online-orders/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={<EmptyState icon={ShoppingBag} message={t(`onlineOrders.empty${status}`)} />}
          ListFooterComponent={list.isFetchingNextPage ? <Spinner className="py-4" /> : null}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          refreshControl={refreshControl}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 8 }}
        />
      )}
    </View>
  );
}
