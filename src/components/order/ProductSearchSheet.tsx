import { BottomSheet, Box, Button, HStack, Text, VStack } from '@/components/base';
import { BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Plus, Search } from 'lucide-react-native';
import { useDebounce } from '@/hooks/use-debounce';
import { OrderProductVariant } from '@/services/order/order.type';
import { useOrderProductSearch } from '@/services/product/product.queries';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

export interface ProductSearchSheetRef {
  open: () => void;
  close: () => void;
}

interface ProductSearchSheetProps {
  orderId: string;
  onSelect: (item: OrderProductVariant) => void;
  children: React.ReactNode;
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const BG_COLORS = ['#3B82F6', '#22C55E', '#A855F7', '#F97316', '#EC4899'];

function SearchResultItem({
  item,
  index,
  onAdd,
}: {
  item: OrderProductVariant;
  index: number;
  onAdd: (item: OrderProductVariant) => void;
}) {
  const { t } = useTranslation();
  const bgColor = BG_COLORS[index % BG_COLORS.length];
  const initial = item.sku?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <HStack className="px-4 py-3 gap-3 items-center border-b border-border">
      <Box
        style={{ backgroundColor: bgColor, width: 48, height: 48, borderRadius: 10 }}
        className="items-center justify-center shrink-0"
      >
        <Text className="text-white text-lg font-bold">{initial}</Text>
      </Box>

      <VStack className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {item.sku}
        </Text>
        <Text className="text-xs text-typography-500">{item.barCode}</Text>
        <HStack className="gap-3 mt-0.5">
          <Text className="text-sm font-bold text-foreground">
            {formatAmount(item.price)} {t('common.currency')}
          </Text>
          <Text className="text-xs text-typography-500 self-center">
            {t('product.inStockLabel')}: {item.quantity} {t('product.unit')}
          </Text>
        </HStack>
      </VStack>

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-xl"
        onPress={() => onAdd(item)}
        disabled={item.quantity === 0}
      >
        <Plus size={20} />
      </Button>
    </HStack>
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
  // useColorScheme is a built-in RN hook — works without any provider, safe inside portal
  const isDark = useColorScheme() === 'dark';
  const surface = isDark ? '#171717' : '#f5f5f5';
  const textColor = isDark ? '#fafafa' : '#0a0a0a';
  const textMuted = isDark ? '#a1a1a1' : '#737373';
  const borderColor = isDark ? '#2e2e2e' : '#e5e5e5';
  return (
    <Box className="flex-1">
      {/* Search input — no BottomSheetDragIndicator here, portal adds its own handle */}
      <HStack
        className="mx-4 mb-3 mt-1 rounded-xl items-center px-3 gap-2"
        style={{ height: 44, backgroundColor: surface, borderWidth: 1, borderColor, borderRadius: 12 }}
      >
        <Search size={18} className="text-muted-foreground shrink-0" />
        <BottomSheetTextInput
          value={searchText}
          onChangeText={onSearchChange}
          placeholder={t('search.searchPlaceholder')}
          placeholderTextColor={textMuted}
          autoFocus
          clearButtonMode="while-editing"
          style={[styles.input, { color: textColor }]}
        />
      </HStack>

      {!hasMinLength ? (
        <Box className="flex-1 items-center justify-center p-8">
          <Text className="text-typography-400 text-sm text-center">
            {t('search.minCharacters')}
          </Text>
        </Box>
      ) : isSearching ? (
        <Box className="flex-1 items-center justify-center p-8">
          <Text className="text-typography-400 text-sm">{t('search.searching')}</Text>
        </Box>
      ) : results.length === 0 ? (
        <Box className="flex-1 items-center justify-center p-8">
          <Text className="text-typography-400 text-sm">{t('search.noProductsFound')}</Text>
        </Box>
      ) : (
        <BottomSheetFlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <SearchResultItem item={item} index={index} onAdd={onSelect} />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
});

export const ProductSearchSheet = forwardRef<ProductSearchSheetRef, ProductSearchSheetProps>(
  function ProductSearchSheet({ orderId, onSelect, children }, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const [searchText, setSearchText] = useState('');
    const debouncedText = useDebounce(searchText, 500);
    // Runs in normal React tree — has access to QueryClientProvider
    const { data, isLoading, isFetching } = useOrderProductSearch(orderId, debouncedText);
    const results = data?.data ?? [];

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.present(),
      close: () => sheetRef.current?.dismiss(),
    }));

    const handleSelect = (item: OrderProductVariant) => {
      sheetRef.current?.dismiss();
      setSearchText('');
      onSelect(item);
    };

    return (
      <>
        {children}
        <BottomSheet ref={sheetRef} snapPoints={['60%', '90%']}>
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
