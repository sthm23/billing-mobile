import { Chip, IconButton, SearchField, Spinner, Text } from '@/components/base';
import { EmptyState } from '@/components/common';
import { useBottomNavInset } from '@/components/navigation/BottomNav';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { Product } from '@/models/product.model';
import { useAuth } from '@/provider/AuthProvider';
import { DEBOUNCE_TIME_MS, productQueryKeys, useProducts, useStoreCategories } from '@/services/product/product.queries';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Package, Plus, SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, View } from 'react-native';
import { useRefreshControl } from '@/hooks/use-refresh-control';

const PAGE_SIZE = 10;
// Fallback until the first response brings the backend threshold.
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export default function ProductListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const bottomInset = useBottomNavInset();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [lowStock, setLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_TIME_MS);
  const { data: categories } = useStoreCategories(user?.staff?.storeId);

  const queryClient = useQueryClient();
  const refreshControl = useRefreshControl(async () => {
    setCurrentPage(1);
    await queryClient.invalidateQueries({ queryKey: productQueryKeys.all() });
  });

  const { data, isLoading, isFetching, isPlaceholderData } = useProducts({
    currentPage,
    pageSize: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    categoryId,
    lowStock,
  });

  // Reset the list when the search or a filter changes
  useEffect(() => {
    setCurrentPage(1);
    setAllProducts([]);
  }, [debouncedSearch, categoryId, lowStock]);

  // Accumulate fresh pages into the list
  useEffect(() => {
    if (!data?.data || isPlaceholderData) return;
    setAllProducts(prev =>
      currentPage === 1 ? data.data : [...prev, ...data.data]
    );
  }, [data, isPlaceholderData]);

  const hasNextPage = data
    ? currentPage < Math.ceil(data.total / PAGE_SIZE)
    : false;

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetching) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage, isFetching]);

  const handleProductPress = (productId: string) => {
    router.push(`/(tabs)/(products)/${productId}`);
  };

  const showInitialSkeleton = (isLoading || (isPlaceholderData && currentPage === 1)) && allProducts.length === 0;
  const lowStockThreshold = data?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  const allLabel =
    !categoryId && data?.counts ? `${t('product.filters.all')} · ${data.counts.all}` : t('product.filters.all');
  const lowLabel = data?.counts ? `${t('product.filters.low')} · ${data.counts.lowStock}` : t('product.filters.low');

  return (
    <View className="flex-1 bg-bg">
      <View className="pt-2 pb-3 gap-3.5">
        <View className="px-4 flex-row items-center justify-between">
          <Text className="type-title text-ink" accessibilityRole="header">{t('product.title')}</Text>
          {/* More filters and product creation are not available yet */}
          <View className="flex-row gap-2">
            <IconButton icon={SlidersHorizontal} accessibilityLabel={t('common.filter')} disabled />
            <IconButton icon={Plus} variant="primary" accessibilityLabel={t('product.createTitle')} disabled />
          </View>
        </View>
        <View className="px-4">
          <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder={t('product.searchPlaceholder')} />
        </View>
        {/* Category is single-choice; «Мало» combines with it */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-4 gap-2"
        >
          <Chip label={allLabel} selected={!categoryId} onPress={() => setCategoryId(undefined)} />
          {(categories ?? []).map((category) => (
            <Chip
              key={category.id}
              label={t(`category.${category.name}`, { defaultValue: category.name })}
              selected={categoryId === category.id}
              onPress={() => setCategoryId(categoryId === category.id ? undefined : category.id)}
            />
          ))}
          <Chip label={lowLabel} tone="err" selected={lowStock} onPress={() => setLowStock((v) => !v)} />
        </ScrollView>
      </View>

      {showInitialSkeleton ? (
        <View className="px-4 gap-2">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={allProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} lowStockThreshold={lowStockThreshold} onPress={handleProductPress} />
          )}
          ListEmptyComponent={
            !isFetching ? (
              <EmptyState
                icon={Package}
                message={debouncedSearch || categoryId || lowStock ? t('product.notFoundProducts') : t('product.empty')}
              />
            ) : null
          }
          ListFooterComponent={
            isFetching && currentPage > 1 ? <Spinner size="sm" className="py-4" /> : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: bottomInset,
            gap: 8,
            flexGrow: allProducts.length === 0 ? 1 : undefined,
          }}
        />
      )}
    </View>
  );
}
