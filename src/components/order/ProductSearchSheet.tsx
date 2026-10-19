import { IconButton, Money, PhotoPlaceholder, SearchField, StatusBadge, Text } from '@/components/base';
import { EmptyState } from '@/components/common';
import { useDebounce } from '@/hooks/use-debounce';
import { OrderProductVariant } from '@/services/order/order.type';
import { useOrderProductSearch } from '@/services/product/product.queries';
import { BottomSheet } from '@expo/ui';
import { Plus, Search } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

export interface ProductSearchSheetRef {
  open: () => void;
  close: () => void;
}

interface ProductSearchSheetProps {
  orderId: string;
  onSelect: (item: OrderProductVariant) => void;
  children: React.ReactNode;
}

function SearchResultItem({
  item,
  onAdd,
}: {
  item: OrderProductVariant;
  onAdd: (item: OrderProductVariant) => void;
}) {
  const { t } = useTranslation();
  const outOfStock = item.quantity === 0;

  return (
    <View className="flex-row items-center gap-3 bg-sunken rounded-lg p-2.5">
      <PhotoPlaceholder size="sm" className="bg-card" />

      <View className="flex-1 min-w-0 gap-1">
        <Text className="type-body-strong text-ink" numberOfLines={1}>
          {item.sku}
        </Text>
        <Text className="font-onest text-xs text-muted tabular-nums">{item.barCode}</Text>
        <View className="flex-row items-center gap-2">
          <Money value={item.price} currency={t('common.currency')} className="text-[15px]" />
          <StatusBadge
            label={`${t('product.inStockLabel')}: ${item.quantity} ${t('product.unit')}`}
            tone={outOfStock ? 'err' : 'ok'}
            size="sm"
          />
        </View>
      </View>

      <IconButton
        icon={Plus}
        variant="primary"
        accessibilityLabel={t('order.add')}
        onPress={() => onAdd(item)}
        disabled={outOfStock}
      />
    </View>
  );
}

interface SheetContentProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  results: OrderProductVariant[];
  isSearching: boolean;
  hasMinLength: boolean;
  onSelect: (item: OrderProductVariant) => void;
}

function SheetContent({
  searchText,
  onSearchChange,
  results,
  isSearching,
  hasMinLength,
  onSelect,
}: SheetContentProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-card px-4 pt-2 gap-3">
      <SearchField
        value={searchText}
        onChangeText={onSearchChange}
        placeholder={t('search.searchPlaceholder')}
        variant="sunken"
        autoFocus
      />

      {!hasMinLength ? (
        <EmptyState icon={Search} message={t('search.minCharacters')} />
      ) : isSearching ? (
        <EmptyState message={t('search.searching')} />
      ) : results.length === 0 ? (
        <EmptyState icon={Search} message={t('search.noProductsFound')} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SearchResultItem item={item} onAdd={onSelect} />}
          contentContainerStyle={{ paddingBottom: 16, gap: 8 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

export const ProductSearchSheet = forwardRef<ProductSearchSheetRef, ProductSearchSheetProps>(
  function ProductSearchSheet({ orderId, onSelect, children }, ref) {
    const [isPresented, setIsPresented] = useState(false);
    const [searchText, setSearchText] = useState('');
    const debouncedText = useDebounce(searchText, 500);
    // Runs in normal React tree — has access to QueryClientProvider
    const { data, isLoading, isFetching } = useOrderProductSearch(orderId, debouncedText);
    const results = data?.data ?? [];

    useImperativeHandle(ref, () => ({
      open: () => setIsPresented(true),
      close: () => setIsPresented(false),
    }));

    const handleDismiss = () => {
      setIsPresented(false);
      setSearchText('');
    };

    const handleSelect = (item: OrderProductVariant) => {
      setIsPresented(false);
      setSearchText('');
      onSelect(item);
    };

    return (
      <>
        {children}
        <BottomSheet
          isPresented={isPresented}
          onDismiss={handleDismiss}
          snapPoints={['half', 'full']}
        >
          <SheetContent
            searchText={searchText}
            onSearchChange={setSearchText}
            results={results}
            isSearching={isLoading || isFetching}
            hasMinLength={debouncedText.length >= 2}
            onSelect={handleSelect}
          />
        </BottomSheet>
      </>
    );
  }
);
