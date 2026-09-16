import { CashboxFilters, CashboxHeader, CashboxStatusFilter } from '@/components/cashbox';
import { EmptyState, LoadingState } from '@/components/common';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Payment } from '@/models/payment.model';
import { useCashboxList } from '@/services/cashbox';
import { CashboxParams } from '@/services/cashbox/cashbox.types';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import { CashboxCard } from './CashboxCard';

export default function CashboxListPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [page, setPage] = useState(1);
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

  if (isError) {
    return <EmptyState message={t('payment.noFound')} />;
  }

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

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
    router.push(`/(tabs)/(payments)/${cashbox.id}`);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as CashboxStatusFilter);
  };

  return (
    <Box className="flex-1">
      {/* Header */}
      <Box className="px-4 py-3 border-b border-border">
        <CashboxHeader
          onOpenCashbox={() => router.push('/(tabs)/(payments)/create')}
        />

        {/* Filters */}
        <CashboxFilters
          value={statusFilter}
          onValueChange={handleStatusFilterChange}
        />
      </Box>

      {/* List */}
      <FlatList
        data={filteredCashboxes}
        renderItem={({ item }) => (
          <CashboxCard cashbox={item} onPress={handleCashboxPress} t={t} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={<EmptyState message={t('payment.noFound')} />}
        ListFooterComponent={
          hasMore ? (
            <Button onPress={handleLoadMore} disabled={isFetching} variant="outline">
              <ButtonText>
                {isFetching ? t('common.loading') : t('common.loadMore')}
              </ButtonText>
            </Button>
          ) : filteredCashboxes.length > 0 ? (
            <Text className="py-4 text-center text-typography-500">
              {t('common.noMoreData')}
            </Text>
          ) : null
        }
      />
    </Box>
  );
}
