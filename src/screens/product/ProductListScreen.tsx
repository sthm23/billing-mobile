import { IconButton, SearchField, Spinner, Text } from '@/components/base';
import { EmptyState } from '@/components/common';
import { useBottomNavInset } from '@/components/navigation/BottomNav';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { Product } from '@/models/product.model';
import { DEBOUNCE_TIME_MS, useProducts } from '@/services/product/product.queries';
import { useRouter } from 'expo-router';
import { Package, Plus, SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

const PAGE_SIZE = 10;

export default function ProductListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const bottomInset = useBottomNavInset();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_TIME_MS);

  const { data, isLoading, isFetching, isPlaceholderData } = useProducts({
    currentPage,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  // Reset list when search query changes
  useEffect(() => {
    setCurrentPage(1);
    setAllProducts([]);
  }, [debouncedSearch]);

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

  const showInitialSkeleton = isLoading && currentPage === 1;

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-2 pb-3 gap-3.5">
        <View className="flex-row items-center justify-between">
          <Text className="type-title text-ink" accessibilityRole="header">{t('product.title')}</Text>
          {/* Filters and product creation are not available yet */}
          <View className="flex-row gap-2">
            <IconButton icon={SlidersHorizontal} accessibilityLabel={t('common.filter')} disabled />
            <IconButton icon={Plus} variant="primary" accessibilityLabel={t('product.createTitle')} disabled />
          </View>
        </View>
        <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder={t('product.search')} />
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
            <ProductCard product={item} onPress={handleProductPress} />
          )}
          ListEmptyComponent={
            !isFetching ? <EmptyState icon={Package} message={t('product.empty')} /> : null
          }
          ListFooterComponent={
            isFetching && currentPage > 1 ? <Spinner size="sm" className="py-4" /> : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
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
