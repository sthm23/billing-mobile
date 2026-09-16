import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsTrigger,
  TabsTriggerText
} from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { CashboxStatus, Payment } from "@/models/payment.model";
import { useCashboxList } from "@/services/cashbox";
import { CashboxParams } from "@/services/cashbox/cashbox.types";
import { useRouter } from "expo-router";
import { Funnel, Receipt } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList } from "react-native";
import { CashboxCard } from "./CashboxCard";

type CashboxStatusFilter = 'all' | CashboxStatus.OPEN | CashboxStatus.CLOSED;

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
          {t('common.loading')}
        </Text>
      </Box>
    );
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
        <HStack className="items-center justify-between mb-3">
          <HStack className="items-center gap-2">
            <Icon as={Receipt} size="xl" className="text-typography-900" />
            <Text size="2xl" bold>
              {t('payment.cashboxList')}
            </Text>
          </HStack>
          <Button
            size="sm"
            onPress={() => router.push('/(tabs)/(payments)/create')}
            disabled
          >
            <ButtonText>+ {t('payment.openCashbox')}</ButtonText>
          </Button>
        </HStack>

        {/* Filters */}
        <HStack className="items-center justify-between gap-3">
          <Tabs
            value={statusFilter}
            onValueChange={handleStatusFilterChange}
            className="flex-1"
          >
            <TabsList className="flex-row">
              <TabsTrigger value="all" className="flex-1">
                <TabsTriggerText>{t('payment.filter.all')}</TabsTriggerText>
              </TabsTrigger>
              <TabsTrigger value={CashboxStatus.OPEN} className="flex-1">
                <TabsTriggerText>{t('payment.filter.open')}</TabsTriggerText>
              </TabsTrigger>
              <TabsTrigger value={CashboxStatus.CLOSED} className="flex-1">
                <TabsTriggerText>{t('payment.filter.closed')}</TabsTriggerText>
              </TabsTrigger>
              <TabsIndicator />
            </TabsList>
          </Tabs>
          <Pressable
            className="p-2 rounded-lg border border-border bg-surface"
            disabled
          >
            <Icon as={Funnel} size="lg" className="text-typography-400" />
          </Pressable>
        </HStack>
      </Box>

      {/* List */}
      <FlatList
        data={filteredCashboxes}
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
