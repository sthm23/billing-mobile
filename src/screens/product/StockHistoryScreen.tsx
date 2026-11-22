import { IconButton, Spinner, Text } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import { StockMovementReason, StockMovementType, type StockMovementHistoryItem } from '@/models/product.model';
import { useStockMovements } from '@/services/product/product.queries';
import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, History } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRefreshControl } from '@/hooks/use-refresh-control';

interface StockHistoryScreenProps {
  variantId: string;
  /** Product name */
  title: string;
  /** Variant label */
  subtitle: string;
  /** Current stock (from the product card) */
  stock?: number;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * «История» of one variant: every stock movement (receipt, sale, return,
 * write-off), newest first, loaded page by page.
 */
export function StockHistoryScreen({ variantId, title, subtitle, stock }: StockHistoryScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useStockMovements(variantId);
  const refreshControl = useRefreshControl(refetch);

  const movements = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  return (
    <View className="flex-1 bg-bg">
      <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        <View className="flex-1 min-w-0">
          <Text className="type-heading text-ink" accessibilityRole="header">
            {t('product.historyScreen.title')}
          </Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {[title, subtitle].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {stock !== undefined && (
          <View className="items-end px-1">
            <Text className="font-onest-bold text-xl text-ink tabular-nums">{stock}</Text>
            <Text className="font-onest text-[11px] text-muted">{t('product.historyScreen.inStock')}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={movements}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MovementRow movement={item} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          refreshControl={refreshControl}
          ListEmptyComponent={
            <EmptyState
              icon={History}
              message={isError ? t('product.historyScreen.loadFailed') : t('product.historyScreen.empty')}
            />
          }
          ListFooterComponent={isFetchingNextPage ? <Spinner size="sm" className="py-4" /> : null}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
            gap: 8,
            flexGrow: movements.length === 0 ? 1 : undefined,
          }}
        />
      )}
    </View>
  );
}

function MovementRow({ movement }: { movement: StockMovementHistoryItem }) {
  const { t } = useTranslation();
  const colors = useTheme();
  const isIn = movement.type === StockMovementType.IN;
  const Icon = isIn ? ArrowDownLeft : ArrowUpRight;
  // A manual OUT adjustment is a write-off in the UI.
  const reasonKey =
    movement.reason === StockMovementReason.ADJUSTMENT ? (isIn ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT') : movement.reason;

  return (
    <View className="flex-row items-center gap-3 bg-card rounded-[20px] px-3.5 py-3">
      <View className={cn('w-10 h-10 rounded-full items-center justify-center', isIn ? 'bg-ok-bg' : 'bg-err-bg')}>
        <Icon size={18} color={isIn ? colors.okFg : colors.errFg} strokeWidth={2.2} />
      </View>
      <View className="flex-1 min-w-0 gap-0.5">
        <Text className="type-body-strong text-ink" numberOfLines={1}>
          {t(`product.historyScreen.reason.${reasonKey}`)}
        </Text>
        <Text className="font-onest text-xs text-muted" numberOfLines={1}>
          {[movement.createdBy, formatDateTime(movement.createdAt)].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View className="items-end gap-0.5">
        <Text className={cn('font-onest-bold text-base tabular-nums', isIn ? 'text-ok-fg' : 'text-err-fg')}>
          {isIn ? '+' : '−'}
          {movement.quantity} {t('product.unit')}
        </Text>
        {movement.unitCost !== null && Number(movement.unitCost) > 0 && (
          <Text className="font-onest text-[11px] text-muted tabular-nums">
            {t('product.historyScreen.perUnit', { amount: formatMoney(movement.unitCost) })}
          </Text>
        )}
      </View>
    </View>
  );
}
