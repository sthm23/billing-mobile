import { Button, HeroCard, IconButton, ListCard, Text } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/libs/date';
import { formatMoney } from '@/libs/format';
import { useDebtor, type CustomerDebtItem } from '@/services/debt';
import { router } from 'expo-router';
import { ChevronLeft, CircleAlert, HandCoins, NotebookPen, ReceiptText } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DebtorScreenProps {
  customerId: string;
}

function openPay(customerId: string, debt: CustomerDebtItem, replace = false) {
  const target = {
    pathname: '/(tabs)/(profile)/debtors/pay' as const,
    params: { customerId, kind: debt.kind, id: debt.id },
  };
  if (replace) router.replace(target);
  else router.push(target);
}

/**
 * Open debts of one customer (orders and manual debts), oldest first. With a
 * single debt the payment screen opens right away.
 */
export function DebtorScreen({ customerId }: DebtorScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { data, isLoading, isError, refetch } = useDebtor(customerId);
  const refreshControl = useRefreshControl(refetch);
  const forwarded = useRef(false);

  // One debt — straight to the payment (back then returns to the list).
  useEffect(() => {
    if (forwarded.current || !data || data.debts.length !== 1) return;
    forwarded.current = true;
    openPay(customerId, data.debts[0], true);
  }, [data, customerId]);

  const title = (debt: CustomerDebtItem) =>
    debt.kind === 'ORDER'
      ? [t('debtors.order'), debt.warehouse?.name].filter(Boolean).join(' · ')
      : debt.description || t('debtors.manual');

  return (
    <View className="flex-1 bg-bg">
      <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        <View className="flex-1 min-w-0">
          <Text className="type-heading text-ink" accessibilityRole="header" numberOfLines={1}>
            {data ? data.customer?.fullName ?? t('debtors.unassigned.title') : t('debtors.title')}
          </Text>
          {data?.customer?.phone ? (
            <Text className="font-onest text-[13px] text-muted">{data.customer.phone}</Text>
          ) : data && !data.customer ? (
            <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>{t('debtors.unassigned.hint')}</Text>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <EmptyState icon={CircleAlert} message={t('debtors.loadFailed')}>
          <Button variant="secondary" onPress={() => refetch()}>{t('sale.pay.retry')}</Button>
        </EmptyState>
      ) : (
        <FlatList
          data={data.debts}
          keyExtractor={(d) => `${d.kind}-${d.id}`}
          ListHeaderComponent={
            data.debts.length > 0 ? (
              <HeroCard
                label={t('debtors.customerDebt')}
                chip={t('debtors.debtsCount', { count: data.debts.length })}
                amount={data.total}
                currency={t('common.currency')}
                className="mb-1"
              />
            ) : null
          }
          renderItem={({ item }) => (
            <ListCard
              leading={
                <View className="w-11 h-11 rounded-full bg-sunken items-center justify-center">
                  {item.kind === 'ORDER' ? (
                    <ReceiptText size={20} color={colors.ink} strokeWidth={2} />
                  ) : (
                    <NotebookPen size={20} color={colors.ink} strokeWidth={2} />
                  )}
                </View>
              }
              title={title(item)}
              subtitle={`${t('debtors.from', { date: formatDate(item.date) })} · ${t('debtors.paidOf', {
                paid: formatMoney(item.paid),
                total: formatMoney(item.total),
              })}`}
              amount={item.remaining}
              amountTone="err"
              onPress={() => openPay(customerId, item)}
            />
          )}
          ListEmptyComponent={<EmptyState icon={HandCoins} message={t('debtors.noDebts')} />}
          refreshControl={refreshControl}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 8 }}
        />
      )}
    </View>
  );
}
