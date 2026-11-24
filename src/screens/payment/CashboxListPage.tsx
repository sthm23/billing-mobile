import { useWorkingWarehouse } from '@/hooks/use-working-warehouse';
import { Button, Chip, IconButton, Segmented, Text, toast } from '@/components/base';
import { type CashboxStatusFilter } from '@/components/cashbox';
import { FilterSheet } from '@/components/cashbox/FilterSheet';
import { ConfirmSheet, EmptyState, LoadingState } from '@/components/common';
import { useBottomNavInset } from '@/components/navigation/BottomNav';
import { CashboxStatus, Payment } from '@/models/payment.model';
import { useCashboxList, useOpenCashbox } from '@/services/cashbox';
import { getApiErrorMessage } from '@/libs/api-error';
import { canOpenCashbox } from '@/libs/roles';
import { useAuth } from '@/provider/AuthProvider';
import { cashboxQueryKeys } from '@/services/cashbox/cashbox.queries';
import { useQueryClient } from '@tanstack/react-query';
import { CashboxParams } from '@/services/cashbox/cashbox.types';
import { useRouter } from 'expo-router';
import { CircleAlert, Plus, SlidersHorizontal, Wallet } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { CashboxCard } from './CashboxCard';
import { CashboxTodayHero } from './CashboxTodayHero';
import { todayRange } from '@/libs/date';
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

  const working = useWorkingWarehouse();
  const { user } = useAuth();
  // Owner / manager / cashier open their own cashbox; a seller uses an open one (UX only — the backend checks)
  const canOpen = canOpenCashbox(user);
  const openCashbox = useOpenCashbox();
  const [openSheet, setOpenSheet] = useState(false);
  const [openWarehouseId, setOpenWarehouseId] = useState<string | undefined>();
  const [openError, setOpenError] = useState<string | null>(null);
  const listParams = useMemo<CashboxParams>(
    () => ({
      currentPage: page,
      pageSize: pageSize,
      // Local day for the «today» totals
      ...todayRange(),
      warehouseId: working.warehouseId,
    }),
    [page, working.warehouseId]
  );

  const { data, isLoading, isFetching, isError } = useCashboxList(listParams, working.isReady);
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

  const startOpenCashbox = () => {
    setOpenError(null);
    setOpenWarehouseId(working.warehouseId);
    setOpenSheet(true);
  };

  const closeOpenSheet = () => {
    if (!openCashbox.isPending) setOpenSheet(false);
  };

  // Opens with balance 0; change is added later as «Приход» (stays in the history)
  const confirmOpenCashbox = () => {
    if (!openWarehouseId) return;
    setOpenError(null);
    openCashbox.mutate(
      { warehouseId: openWarehouseId },
      {
        onSuccess: (cashbox) => {
          setOpenSheet(false);
          toast.show(t('payment.openCashboxSheet.done'));
          router.push(`/(tabs)/(cashbox)/${cashbox.id}`);
        },
        onError: (err) => setOpenError(getApiErrorMessage(err, t('payment.openCashboxSheet.failed'))),
      }
    );
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
          {canOpen ? (
            <Button variant="primary" icon={Plus} onPress={startOpenCashbox} disabled={!working.warehouseId}>
              {t('payment.openCashbox')}
            </Button>
          ) : null}
        </View>
        {data?.today && <CashboxTodayHero today={data.today} />}
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
      <ConfirmSheet
        isOpen={openSheet}
        onClose={closeOpenSheet}
        title={t('payment.openCashbox')}
        message={t('payment.openCashboxSheet.text')}
        confirmLabel={t('payment.openCashboxSheet.confirm')}
        loading={openCashbox.isPending}
        error={openError}
        onConfirm={confirmOpenCashbox}
      >
        {/* The working warehouse is preselected; another one of the user's warehouses can be chosen */}
        {working.warehouses.length > 1 ? (
          <View className="gap-2">
            <Text className="font-onest-semibold text-[13px] text-soft">{t('payment.openCashboxSheet.warehouse')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {working.warehouses.map((w) => (
                <Chip
                  key={w.id}
                  label={w.name}
                  tone="sunken"
                  selected={openWarehouseId === w.id}
                  onPress={() => setOpenWarehouseId(w.id)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ConfirmSheet>

      {isOpenFilter && (
        <FilterSheet isOpen={isOpenFilter} isClose={() => setToggleFilter(false)} />
      )}
    </View>
  );
}
