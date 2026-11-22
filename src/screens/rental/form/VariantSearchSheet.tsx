import { IconButton, Money, PhotoPlaceholder, Pressable, SearchField, Text } from '@/components/base';
import { Sheet, SheetFlatList } from '@/components/base/Sheet';
import { EmptyState } from '@/components/common';
import { useDebounce } from '@/hooks/use-debounce';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { useRentableVariantSearch, type RentableVariant } from '@/services/rental';
import { Check, PackageSearch, Search, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

interface VariantSearchSheetProps {
  isOpen: boolean;
  warehouseId: string | undefined;
  /** Variants already in the booking */
  addedIds: string[];
  onClose: () => void;
  onPick: (variant: RentableVariant) => void;
}

/** «Добавить вещь»: rentable variants of the warehouse by name, SKU or barcode */
export function VariantSearchSheet({ isOpen, warehouseId, addedIds, onClose, onPick }: VariantSearchSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const { data, isFetching, isError } = useRentableVariantSearch(isOpen ? warehouseId : undefined, debounced);

  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const variants = debounced.trim().length >= 2 ? (data ?? []) : [];

  const renderBody = () => {
    if (debounced.trim().length < 2) {
      return <EmptyState icon={Search} message={t('rental.form.searchHint')} />;
    }
    if (isError) return <EmptyState icon={PackageSearch} message={t('rental.form.searchFailed')} />;
    if (variants.length === 0) {
      return isFetching ? (
        <ActivityIndicator color={colors.muted} className="pt-6" />
      ) : (
        <EmptyState icon={PackageSearch} message={t('rental.form.searchEmpty')} description={t('rental.form.searchEmptyHint')} />
      );
    }
    return (
      <SheetFlatList
        className="flex-1"
        data={variants}
        keyExtractor={(item: RentableVariant) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
        renderItem={({ item }: { item: RentableVariant }) => {
          const added = addedIds.includes(item.id);
          const attrs = item.attributes.map((a) => a.value).filter(Boolean).join(' · ');
          return (
            <Pressable
              onPress={() => onPick(item)}
              disabled={added}
              accessibilityRole="button"
              accessibilityState={{ disabled: added }}
              className={cn('flex-row items-center gap-3 p-2.5 rounded-lg bg-sunken', added && 'opacity-60')}
            >
              <PhotoPlaceholder size="sm" />
              <View className="flex-1 min-w-0 gap-0.5">
                <Text className="type-body-strong text-ink" numberOfLines={1}>{item.productName}</Text>
                <Text className="font-onest text-xs text-muted" numberOfLines={1}>
                  {[attrs || null, item.sku].filter(Boolean).join(' · ')}
                </Text>
                <Text className="font-onest text-xs text-soft">{t('rental.form.owned', { count: item.quantity })}</Text>
              </View>
              {added ? (
                <Check size={20} color={colors.ink} strokeWidth={2.2} />
              ) : (
                <View className="items-end">
                  <Money value={item.rentPricePerDay} currency={null} className="font-onest-bold text-[15px] text-ink" />
                  <Text className="font-onest text-[11px] text-muted">{t('rental.form.perDay')}</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-1 px-4 pt-2 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="type-title text-ink" accessibilityRole="header">{t('rental.form.addItem')}</Text>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder={t('rental.form.searchPlaceholder')}
          variant="sunken"
          autoFocus
        />
        {renderBody()}
      </View>
    </Sheet>
  );
}
