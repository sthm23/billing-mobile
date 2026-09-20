import { ActionButtons } from '@/components/product/ActionButtons';
import { EmptyProductList } from '@/components/product/EmptyProductList';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { ProductListHeader } from '@/components/product/ProductListHeader';
import { SearchBar } from '@/components/product/SearchBar';
import { Box } from '@/components/ui/box';
import { Divider } from '@/components/ui/divider';
import { VStack } from '@/components/ui/vstack';
import { useDebounce } from '@/hooks/use-debounce';
import { Product } from '@/services/product/product.type';
import { DEBOUNCE_TIME_MS, useProducts } from '@/services/product/product.queries';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';

const PAGE_SIZE = 10;

export default function ProductListScreen() {
  const router = useRouter();
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

  const handleCreatePress = () => {
    console.log('Create product pressed');
  };

  const handleScanPress = () => {
    console.log('Scan pressed');
  };

  const handleFilterPress = () => {
    console.log('Filter pressed');
  };

  const showInitialSkeleton = isLoading && currentPage === 1;

  return (
    <VStack className="flex-1 bg-background">
      <ProductListHeader onCreatePress={handleCreatePress} />

      <Box className="w-full flex flex-row items-center justify-between px-4 pb-3 gap-2">
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        <ActionButtons
          onScanPress={handleScanPress}
          onFilterPress={handleFilterPress}
        />
      </Box>

      {showInitialSkeleton ? (
        <VStack className="px-4 gap-3">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </VStack>
      ) : (
        <FlatList
          data={allProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={handleProductPress} />
          )}
          ItemSeparatorComponent={() => <Divider className="my-2" />}
          ListEmptyComponent={
            !isFetching ? (
              <EmptyProductList onCreatePress={handleCreatePress} />
            ) : null
          }
          ListFooterComponent={
            isFetching && currentPage > 1 ? (
              <ActivityIndicator className="py-4" />
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            flexGrow: allProducts.length === 0 ? 1 : undefined,
          }}
        />
      )}
    </VStack>
  );
}
