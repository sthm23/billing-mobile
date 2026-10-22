import { Button, IconButton, Segmented, Text } from '@/components/base';
import { type CashboxStatusFilter } from '@/components/cashbox';
import { FilterSheet } from '@/components/cashbox/FilterSheet';
import { EmptyState, LoadingState } from '@/components/common';
import { useBottomNavInset } from '@/components/navigation/BottomNav';
import { CashboxStatus, Payment } from '@/models/payment.model';
import { useCashboxList } from '@/services/cashbox';
import { cashboxQueryKeys } from '@/services/cashbox/cashbox.queries';
import { useQueryClient } from '@tanstack/react-query';
import { CashboxParams } from '@/services/cashbox/cashbox.types';
import { useRouter } from 'expo-router';
import { CircleAlert, Plus, SlidersHorizontal, Wallet } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { CashboxCard } from './CashboxCard';
import { useRefreshControl } from '@/hooks/use-refresh-control';

export default function CashboxListPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const bottomInset = useBottomNavInset();
  const [page, setPage] = useState(1);
  const [isOpenFilter, setToggleFilter] = useState<boolean>(false);
  const [cashboxes, setCashboxes] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState<CashboxStatusFilter>('all');
  const pageSize = 10;

  const listParams = useMemo<CashboxParams>(
    () => ({
      currentPage: page,
      pageSize: pageSize,
      search: undefined,
      fromDate: undefined,
      toDate: undefined,
    }),
    [page]
  );

  const { data, isLoading, isFetching, isError } = useCashboxList(listParams);
  const queryClient = useQueryClient();
  const refreshControl = useRefreshControl(async () => {
    setPage(1);
    await queryClient.invalidateQueries({ queryKey: cashboxQueryKeys.all() });
  });

  useEffect(() => {
    if (!data?.data) {
      return;
    }

    if (page === 1) {
      setCashboxes(data.data);
      return;
    }

    setCashboxes((prev) => {
      const knownIds = new Set(prev.map((item) => item.id));
      const nextPageItems = data.data.filter((item) => !knownIds.has(item.id));
      return [...prev, ...nextPageItems];
    });
  }, [data, page]);

  // Filter cashboxes by status
  const filteredCashboxes = useMemo(() => {
    if (statusFilter === 'all') {
      return cashboxes;
    }
    return cashboxes.filter((cashbox) => cashbox.status === statusFilter);
  }, [cashboxes, statusFilter]);

  const hasMore = data ? data.currentPage * data.pageSize < data.total : false;

  const handleLoadMore = () => {
    if (!hasMore || isFetching) {
      return;
    }
    setPage((prev) => prev + 1);
  };

  const handleCashboxPress = (cashbox: Payment) => {
    router.push(`/(tabs)/(cashbox)/${cashbox.id}`);
  };

  const filterOptions: { value: CashboxStatusFilter; label: string }[] = [
    { value: 'all', label: t('payment.filter.all') },
    { value: CashboxStatus.OPEN, label: t('payment.filter.open') },
    { value: CashboxStatus.CLOSED, label: t('payment.filter.closed') },
  ];

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-2 pb-3 gap-3">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="type-title text-ink flex-1" accessibilityRole="header">{t('payment.cashboxList')}</Text>
          <IconButton
            icon={SlidersHorizontal}
            accessibilityLabel={t('common.filter')}
            onPress={() => setToggleFilter(prev => !prev)}
          />
          {/* The open-cashbox screen doesn't exist yet */}
          <Button variant="primary" icon={Plus} disabled>
            {t('payment.openCashbox')}
          </Button>
        </View>
        <Segmented options={filterOptions} value={statusFilter} onChange={setStatusFilter} />
      </View>

      {isError ? (
        <EmptyState icon={CircleAlert} message={t('payment.noFound')} />
      ) : isLoading ? (
        <LoadingState message={t('common.loading')} />
      ) : (
        <FlatList
          data={filteredCashboxes}
          renderItem={({ item }) => (
            <CashboxCard cashbox={item} onPress={handleCashboxPress} t={t} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: bottomInset, gap: 8 }}
          ListEmptyComponent={<EmptyState icon={Wallet} message={t('payment.noFound')} />}
          refreshControl={refreshControl}
          ListFooterComponent={
            hasMore ? (
              <Button variant="secondary" full onPress={handleLoadMore} loading={isFetching} className="mt-2">
                {t('common.loadMore')}
              </Button>
            ) : filteredCashboxes.length > 0 ? (
              <Text className="py-4 text-center font-onest text-[13px] text-muted">
                {t('common.noMoreData')}
              </Text>
            ) : null
          }
        />
      )}
      {isOpenFilter && (
        <FilterSheet isOpen={isOpenFilter} isClose={() => setToggleFilter(false)} />
      )}
    </View>
  );
}
