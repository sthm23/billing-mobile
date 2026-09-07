import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useCashboxList } from "@/services/cashbox";
import { CashboxParams } from "@/services/cashbox/cashbox.types";
import { Payment } from "@/models/payment.model";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, ActivityIndicator } from "react-native";
import { CashboxCard } from "./CashboxCard";

export default function CashboxListPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [cashboxes, setCashboxes] = useState<Payment[]>([]);
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
    return (
      <Box className="flex-1 items-center justify-center p-4">
        <Text size="xl" bold className="text-error-600">
          {t('payment.noFound')}
        </Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text size="lg" className="mt-4">
          {t('order.search')}...
        </Text>
      </Box>
    );
  }

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

  return (
    <Box className="flex-1">
      <Box className="flex-row items-center justify-between px-4 py-3">
        <Text size="2xl" bold>
          {t('payment.cashboxList')}
        </Text>
        <Button
          size="sm"
          onPress={() => router.push('/(tabs)/(payments)/create')}
        >
          <ButtonText>{t('payment.openCashbox')}</ButtonText>
        </Button>
      </Box>

      <FlatList
        data={cashboxes}
        renderItem={({ item }) => (
          <CashboxCard cashbox={item} onPress={handleCashboxPress} t={t} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={
          <Box className="flex-1 items-center justify-center py-10">
            <Text size="lg" className="text-typography-500">
              {t('payment.noFound')}
            </Text>
          </Box>
        }
        ListFooterComponent={
          hasMore ? (
            <Button onPress={handleLoadMore} disabled={isFetching} variant="outline">
              <ButtonText>
                {isFetching ? t('order.search') + '...' : t('order.search')}
              </ButtonText>
            </Button>
          ) : cashboxes.length > 0 ? (
            <Text className="py-4 text-center text-typography-500">
              {t('product.noOrders')}
            </Text>
          ) : null
        }
      />
    </Box>
  );
}
