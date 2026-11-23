import { useWorkingWarehouse } from '@/hooks/use-working-warehouse';
import { Chip, IconButton, SearchField, Spinner, Text } from '@/components/base';
import { EmptyState } from '@/components/common';
import { useBottomNavInset } from '@/components/navigation/BottomNav';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { Product } from '@/models/product.model';
import { useAuth } from '@/provider/AuthProvider';
import { categoryLabel } from '@/libs/category';
import { canCreateProduct, canManageProducts } from '@/libs/roles';
import { useStoreCategories } from '@/services/category';
import { DEBOUNCE_TIME_MS, productQueryKeys, useProducts } from '@/services/product/product.queries';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Archive, Package, Plus, SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, View } from 'react-native';
import { useRefreshControl } from '@/hooks/use-refresh-control';

const PAGE_SIZE = 10;
// Fallback until the first response brings the backend threshold.
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export default function ProductListScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const bottomInset = useBottomNavInset();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [lowStock, setLowStock] = useState(false);
  // «Архив» (owner / manager): archived products instead of the active ones
  const [archived, setArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_TIME_MS);
  const { data: directions } = useStoreCategories(user?.staff?.storeId);
  // Chips are the subcategories of the store direction
  const subcategories = useMemo(() => (directions ?? []).flatMap((d) => d.children ?? []), [directions]);

  const queryClient = useQueryClient();
  const refreshControl = useRefreshControl(async () => {
    setCurrentPage(1);
    await queryClient.invalidateQueries({ queryKey: productQueryKeys.all() });
  });

  const working = useWorkingWarehouse();
  const canManageArchive = canManageProducts(user);
  const { data, isLoading, isFetching, isPlaceholderData } = useProducts(
    {
      currentPage,
      pageSize: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      categoryId,
      lowStock: lowStock && !archived,
      archived: canManageArchive && archived,
      warehouseId: working.warehouseId,
    },
    working.isReady
  );

  // Reset the list when the search, a filter or the working warehouse changes
  useEffect(() => {
    setCurrentPage(1);
    setAllProducts([]);
  }, [debouncedSearch, categoryId, lowStock, archived, working.warehouseId]);

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
    // A draft (card without variants) opens step 2 «Варианты» — only owner/manager see drafts
    const product = allProducts.find((p) => p.id === productId);
    // An archived draft opens the read-only card, where it can be restored
    if (product?.isDraft && !product.isArchived && canManageProducts(user)) {
      router.push({ pathname: '/(tabs)/(products)/variants/[id]', params: { id: productId } });
      return;
    }
    router.push(`/(tabs)/(products)/${productId}`);
  };

  const showInitialSkeleton = (isLoading || (isPlaceholderData && currentPage === 1)) && allProducts.length === 0;
  const lowStockThreshold = data?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  const allLabel =
    !categoryId && data?.counts ? `${t('product.filters.all')} · ${data.counts.all}` : t('product.filters.all');
  const lowLabel = data?.counts ? `${t('product.filters.low')} · ${data.counts.lowStock}` : t('product.filters.low');
  const archiveLabel = data?.counts
    ? `${t('product.filters.archive')} · ${data.counts.archived}`
    : t('product.filters.archive');

  // «Все» returns to the full active list; «Мало» and «Архив» exclude each other
  const selectAll = () => {
    setCategoryId(undefined);
    setArchived(false);
  };
  const toggleLowStock = () => {
    setLowStock((v) => !v);
    setArchived(false);
  };
  const toggleArchived = () => {
    setArchived((v) => !v);
    setLowStock(false);
  };

  const emptyMessage = archived
    ? t('product.archivedEmpty')
    : debouncedSearch || categoryId || lowStock
      ? t('product.notFoundProducts')
      : t('product.empty');

  return (
    <View className="flex-1 bg-bg">
      <View className="pt-2 pb-3 gap-3.5">
        <View className="px-4 flex-row items-center justify-between">
          <Text className="type-title text-ink" accessibilityRole="header">{t('product.title')}</Text>
          {/* More filters are not available yet; a product is created by the owner (UX only) */}
          <View className="flex-row gap-2">
            <IconButton icon={SlidersHorizontal} accessibilityLabel={t('common.filter')} disabled />
            {canCreateProduct(user) ? (
              <IconButton
                icon={Plus}
                variant="primary"
                accessibilityLabel={t('product.createTitle')}
                onPress={() => router.push('/(tabs)/(products)/create')}
              />
            ) : null}
          </View>
        </View>
        <View className="px-4">
          <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder={t('product.searchPlaceholder')} />
        </View>
        {/* Category is single-choice; «Мало» / «Архив» combine with it */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-4 gap-2"
        >
          <Chip label={allLabel} selected={!categoryId && !archived} onPress={selectAll} />
          {/* «Мало» and «Архив» go before the subcategories: a direction can have many */}
          <Chip label={lowLabel} tone="err" selected={lowStock && !archived} onPress={toggleLowStock} />
          {canManageArchive ? (
            <Chip label={archiveLabel} selected={archived} onPress={toggleArchived} />
          ) : null}
          {subcategories.map((category) => (
            <Chip
              key={category.id}
              label={categoryLabel(category, i18n.language)}
              selected={categoryId === category.id}
              onPress={() => setCategoryId(categoryId === category.id ? undefined : category.id)}
            />
          ))}
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
              <EmptyState icon={archived ? Archive : Package} message={emptyMessage} />
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
