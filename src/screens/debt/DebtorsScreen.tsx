import { HeroCard, IconButton, ListCard, SearchField, Segmented, Text, type StatusTone } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useDebounce } from '@/hooks/use-debounce';
import { useTheme } from '@/hooks/use-theme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { formatDayMonth } from '@/libs/date';
import { UNASSIGNED_DEBTOR, useDebtors, type Debtor, type DebtorsSort } from '@/services/debt';
import { DEBOUNCE_TIME_MS } from '@/services/product/product.queries';
import { router } from 'expo-router';
import { ChevronLeft, CircleAlert, HandCoins, UserRoundX } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Badge of the debt age (design «Debtors»): over 30 days red, from 21 yellow. */
function ageTone(days: number): StatusTone {
  if (days > 30) return 'err';
  if (days >= 21) return 'warn';
  return 'neutral';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/**
 * «Должники» (design «Debtors»): customers with open debts (DEBT orders and
 * manual debts) of the whole store, totals from the backend, search and sort.
 */
export function DebtorsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<DebtorsSort>('amount');
  const debouncedSearch = useDebounce(search, DEBOUNCE_TIME_MS);
  const { data, isLoading, isError, refetch } = useDebtors({
    search: debouncedSearch.trim() || undefined,
    sort,
  });
  const refreshControl = useRefreshControl(refetch);

  const meta = (d: Pick<Debtor, 'ordersCount' | 'lastPaymentAt'> & { debtsCount?: number }) =>
    [
      d.ordersCount > 0 ? t('debtors.orders', { count: d.ordersCount }) : null,
      d.debtsCount ? t('debtors.manualDebts', { count: d.debtsCount }) : null,
      d.lastPaymentAt ? t('debtors.lastPayment', { date: formatDayMonth(d.lastPaymentAt) }) : t('debtors.noPayments'),
    ]
      .filter(Boolean)
      .join(' · ');

  const openDebtor = (customerId: string) =>
    router.push({ pathname: '/(tabs)/(profile)/debtors/[customerId]', params: { customerId } });

  // Orders without a customer (older data): one card, hidden while searching by name/phone.
  const unassigned = !debouncedSearch && data?.unassigned ? data.unassigned : null;

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-2 pb-3 gap-3">
        <View className="flex-row items-center gap-2.5">
          <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
          <Text className="flex-1 type-heading text-ink" accessibilityRole="header">{t('debtors.title')}</Text>
        </View>
        {data && (
          <HeroCard
            label={t('debtors.totalDebt')}
            chip={t('debtors.customers', { count: data.summary.customers })}
            amount={data.summary.total}
            currency={t('common.currency')}
            tiles={[
              { label: t('debtors.over30'), value: data.summary.over30, tone: 'err' },
              { label: t('debtors.paidThisMonth'), value: data.summary.paidInPeriod, tone: 'accent', signed: true },
            ]}
          />
        )}
        <SearchField value={search} onChangeText={setSearch} placeholder={t('debtors.search')} />
        <Segmented
          options={[
            { value: 'amount', label: t('debtors.sortAmount') },
            { value: 'date', label: t('debtors.sortDate') },
          ]}
          value={sort}
          onChange={setSort}
        />
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError && !data ? (
        <EmptyState icon={CircleAlert} message={t('debtors.loadFailed')} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(d) => d.customerId}
          renderItem={({ item }) => (
            <ListCard
              lead={initials(item.fullName)}
              title={item.fullName}
              subtitle={meta(item)}
              amount={item.total}
              amountTone="err"
              badge={{ label: t('debtors.ageDays', { count: item.ageDays }), tone: ageTone(item.ageDays) }}
              onPress={() => openDebtor(item.customerId)}
            />
          )}
          ListHeaderComponent={
            unassigned ? (
              <ListCard
                leading={
                  <View className="w-11 h-11 rounded-full bg-warn-bg items-center justify-center">
                    <UserRoundX size={20} color={colors.warnFg} strokeWidth={2} />
                  </View>
                }
                title={t('debtors.unassigned.title')}
                subtitle={meta(unassigned)}
                amount={unassigned.total}
                amountTone="err"
                badge={{ label: t('debtors.ageDays', { count: unassigned.ageDays }), tone: ageTone(unassigned.ageDays) }}
                onPress={() => openDebtor(UNASSIGNED_DEBTOR)}
              />
            ) : null
          }
          ListEmptyComponent={
            unassigned ? null : (
              <EmptyState icon={HandCoins} message={debouncedSearch ? t('debtors.notFound') : t('debtors.empty')} />
            )
          }
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 8 }}
        />
      )}
    </View>
  );
}
