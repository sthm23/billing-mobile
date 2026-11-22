import { IconButton, Pressable, SearchField, Text } from '@/components/base';
import { Sheet, SheetFlatList } from '@/components/base/Sheet';
import { EmptyState } from '@/components/common';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { useStoreBrands, type StoreBrand } from '@/services/category';
import { BadgeCheck, Check, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

interface BrandSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Store whose brands are listed */
  storeId: string | undefined;
  selectedId?: string | null;
  onSelect: (brand: StoreBrand) => void;
}

/**
 * Brand picker of the product form: brands linked to the store, with search.
 * Brands are a shared dictionary managed by the platform admin — no «add» here.
 */
export function BrandSheet({ isOpen, onClose, storeId, selectedId, onSelect }: BrandSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useStoreBrands(isOpen ? storeId : undefined);

  useEffect(() => {
    if (isOpen) setSearch('');
  }, [isOpen]);

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    const list = [...(data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    return q ? list.filter((b) => b.name.toLocaleLowerCase().includes(q)) : list;
  }, [data, search]);

  const pick = (brand: StoreBrand) => {
    onSelect(brand);
    onClose();
  };

  const renderBody = () => {
    if (isLoading) return <ActivityIndicator color={colors.muted} className="pt-6" />;
    if (isError) {
      return (
        <Pressable onPress={() => void refetch()} accessibilityRole="button">
          <EmptyState icon={BadgeCheck} message={t('productForm.brandSheet.loadFailed')} />
        </Pressable>
      );
    }
    if (!data?.length) return <EmptyState icon={BadgeCheck} message={t('productForm.brandSheet.empty')} />;
    if (!visible.length) return <EmptyState icon={BadgeCheck} message={t('productForm.brandSheet.notFound')} />;

    return (
      <SheetFlatList
        className="flex-1"
        data={visible}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
        renderItem={({ item }) => {
          const selected = item.id === selectedId;
          return (
            <Pressable
              onPress={() => pick(item)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={cn(
                'flex-row items-center gap-3 h-[52px] px-4 rounded-2xl bg-sunken active:opacity-80',
                selected && 'border-2 border-accent',
              )}
            >
              <Text className="flex-1 min-w-0 type-body-strong text-ink" numberOfLines={1}>
                {item.name}
              </Text>
              {selected ? <Check size={20} color={colors.ink} strokeWidth={2.2} /> : null}
            </Pressable>
          );
        }}
      />
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-1 px-4 pt-2 gap-3">
        <View className="flex-row items-start gap-2">
          <Text className="flex-1 type-title text-ink" accessibilityRole="header">
            {t('productForm.brandSheet.title')}
          </Text>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder={t('productForm.brandSheet.searchPlaceholder')}
          variant="sunken"
        />
        {renderBody()}
      </View>
    </Sheet>
  );
}
