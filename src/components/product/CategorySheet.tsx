import { Button, IconButton, Pressable, SearchField, Text } from '@/components/base';
import { Sheet, SheetFlatList } from '@/components/base/Sheet';
import { EmptyState } from '@/components/common';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { categoryHasName, categoryLabel, categoryMatches } from '@/libs/category';
import { canAddCategory } from '@/libs/roles';
import { cn } from '@/libs/utils';
import type { Category } from '@/models/product.model';
import { useAuth } from '@/provider/AuthProvider';
import { useCreateSubcategory, useStoreCategories } from '@/services/category';
import { Check, Plus, Tags, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

/** Same limits as the backend (`CATEGORY_NAME_MIN/MAX`) */
const NAME_MIN = 2;
const NAME_MAX = 50;

interface CategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Store whose direction lists the subcategories */
  storeId: string | undefined;
  selectedId?: string | null;
  /** A subcategory was picked or added */
  onSelect: (category: Category) => void;
}

/**
 * Product category picker: subcategories of the store direction with search
 * over all languages. OWNER / ADMIN may add a missing one
 * («Добавить «…»» → `POST /category/subcategory`, find-or-create).
 * Used by the product form (not built yet in mobile).
 */
export function CategorySheet({ isOpen, onClose, storeId, selectedId, onSelect }: CategorySheetProps) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useStoreCategories(isOpen ? storeId : undefined);
  const create = useCreateSubcategory();

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setError(null);
  }, [isOpen]);

  // One direction per store
  const direction = data?.[0];
  const subcategories = useMemo(() => direction?.children ?? [], [direction]);
  const visible = useMemo(
    () => subcategories.filter((c) => categoryMatches(c, search)),
    [subcategories, search],
  );

  const name = search.trim().replace(/\s+/g, ' ');
  const exists = subcategories.some((c) => categoryHasName(c, name));
  const showAdd = canAddCategory(user) && !!direction && name.length >= NAME_MIN && !exists;

  const pick = (category: Category) => {
    onSelect(category);
    onClose();
  };

  const add = () => {
    if (!direction) return;
    setError(null);
    create.mutate(
      { parentId: direction.id, name },
      {
        onSuccess: pick,
        onError: (e) => setError(getApiErrorMessage(e, t('categoryPicker.addFailed'))),
      },
    );
  };

  const renderBody = () => {
    if (isLoading) return <ActivityIndicator color={colors.muted} className="pt-6" />;
    if (isError) {
      return (
        <Pressable onPress={() => void refetch()} accessibilityRole="button">
          <EmptyState icon={Tags} message={t('categoryPicker.loadFailed')} />
        </Pressable>
      );
    }
    if (!direction) return <EmptyState icon={Tags} message={t('categoryPicker.noDirection')} />;
    if (!visible.length) {
      return showAdd ? null : (
        <EmptyState icon={Tags} message={search.trim() ? t('categoryPicker.notFound') : t('categoryPicker.empty')} />
      );
    }

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
                {categoryLabel(item, i18n.language)}
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
          <View className="flex-1 min-w-0 gap-0.5">
            <Text className="type-title text-ink" accessibilityRole="header">{t('categoryPicker.title')}</Text>
            {direction ? (
              <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
                {categoryLabel(direction, i18n.language)}
              </Text>
            ) : null}
          </View>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>

        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder={t('categoryPicker.searchPlaceholder')}
          variant="sunken"
          maxLength={NAME_MAX}
        />

        {showAdd ? (
          <Button variant="secondary" icon={Plus} loading={create.isPending} onPress={add}>
            {t('categoryPicker.add', { name })}
          </Button>
        ) : null}
        {!canAddCategory(user) && direction && search.trim() && !visible.length ? (
          <Text className="font-onest text-[13px] text-muted px-1">{t('categoryPicker.ownerHint')}</Text>
        ) : null}
        {error ? (
          <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}

        {renderBody()}
      </View>
    </Sheet>
  );
}
