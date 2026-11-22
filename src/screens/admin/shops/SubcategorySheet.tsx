import { Button, IconButton, Text, toast } from '@/components/base';
import { Sheet, SheetTextInput } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import type { Category } from '@/models/product.model';
import { useDeleteSubcategory, useUpdateSubcategory } from '@/services/category';
import { Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const INPUT_CLASS = 'h-[52px] px-4 rounded-2xl bg-sunken font-onest text-base text-ink';
/** Same limits as the backend (`CATEGORY_NAME_MIN/MAX`) */
const NAME_MIN = 2;
const NAME_MAX = 50;

interface SubcategorySheetProps {
  /** The subcategory being edited; null — closed */
  category: Category | null;
  /** Direction label for the subtitle */
  directionName: string;
  onClose: () => void;
}

const clean = (value: string) => value.trim().replace(/\s+/g, ' ');

/**
 * ADMIN: rename / translate a subcategory of the shared dictionary
 * (`PATCH /category/subcategory/:id`) or delete one without products
 * (`DELETE …`, confirmed in place). The backend answers 409 / 400 with a message.
 */
export function SubcategorySheet({ category, directionName, onClose }: SubcategorySheetProps) {
  return (
    <Sheet isOpen={!!category} onClose={onClose} size="auto">
      {/* Remounted per category, so the fields start from its names */}
      {category ? <SubcategoryForm key={category.id} category={category} directionName={directionName} onClose={onClose} /> : <View />}
    </Sheet>
  );
}

function SubcategoryForm({
  category,
  directionName,
  onClose,
}: { category: Category } & Omit<SubcategorySheetProps, 'category'>) {
  const { t } = useTranslation();
  const colors = useTheme();
  const update = useUpdateSubcategory();
  const remove = useDeleteSubcategory();
  const [name, setName] = useState(category.name);
  const [nameUz, setNameUz] = useState(category.nameUz ?? '');
  const [nameEn, setNameEn] = useState(category.nameEn ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send only the changed fields; an empty translation clears it
  const changes = {
    ...(clean(name) !== category.name ? { name: clean(name) } : {}),
    ...(clean(nameUz) !== (category.nameUz ?? '') ? { nameUz: clean(nameUz) } : {}),
    ...(clean(nameEn) !== (category.nameEn ?? '') ? { nameEn: clean(nameEn) } : {}),
  };
  const nameValid = clean(name).length >= NAME_MIN && [nameUz, nameEn].every((v) => !clean(v) || clean(v).length >= NAME_MIN);
  const busy = update.isPending || remove.isPending;

  const save = () => {
    setError(null);
    update.mutate(
      { id: category.id, ...changes },
      {
        onSuccess: () => {
          toast.show(t('adminShop.catalog.edit.saved'));
          onClose();
        },
        onError: (e) => setError(getApiErrorMessage(e, t('adminShop.catalog.edit.saveFailed'))),
      },
    );
  };

  const doDelete = () => {
    setError(null);
    remove.mutate(category.id, {
      onSuccess: () => {
        toast.show(t('adminShop.catalog.edit.deleted'));
        onClose();
      },
      onError: (e) => {
        setConfirmDelete(false);
        setError(getApiErrorMessage(e, t('adminShop.catalog.edit.deleteFailed')));
      },
    });
  };

  const field = (label: string, value: string, onChange: (v: string) => void, optional: boolean) => (
    <View className="gap-1.5">
      <Text className="font-onest-semibold text-[13px] text-soft">
        {optional ? `${label} · ${t('adminShop.catalog.edit.optional')}` : label}
      </Text>
      <SheetTextInput
        value={value}
        onChangeText={onChange}
        placeholderTextColor={colors.muted}
        className={INPUT_CLASS}
        maxLength={NAME_MAX}
        accessibilityLabel={label}
      />
    </View>
  );

  return (
    <View className="px-4 pt-1 pb-3 gap-3.5">
      <View className="flex-row items-start gap-2">
        <View className="flex-1 min-w-0 gap-0.5">
          <Text className="type-title text-ink" accessibilityRole="header">{t('adminShop.catalog.edit.title')}</Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={2}>
            {t('adminShop.catalog.edit.subtitle', { direction: directionName })}
          </Text>
        </View>
        <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
      </View>

      {confirmDelete ? (
        <View className="gap-3">
          <Text className="font-onest-semibold text-[15px] text-ink">
            {t('adminShop.catalog.edit.deleteTitle', { name: category.name })}
          </Text>
          <Text className="font-onest text-[13px] leading-[18px] text-muted">{t('adminShop.catalog.edit.deleteText')}</Text>
          <View className="flex-row gap-2.5">
            <Button variant="secondary" size="lg" className="flex-1" disabled={busy} onPress={() => setConfirmDelete(false)}>
              {t('common.back')}
            </Button>
            <Button variant="danger" size="lg" className="flex-1" loading={remove.isPending} onPress={doDelete}>
              {t('adminShop.catalog.edit.deleteConfirm')}
            </Button>
          </View>
        </View>
      ) : (
        <>
          {field(t('adminShop.catalog.edit.nameRu'), name, setName, false)}
          {field(t('adminShop.catalog.edit.nameUz'), nameUz, setNameUz, true)}
          {field(t('adminShop.catalog.edit.nameEn'), nameEn, setNameEn, true)}
        </>
      )}

      {error ? (
        <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
          <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
        </View>
      ) : null}

      {confirmDelete ? null : (
        <View className="gap-2">
          <Button
            size="lg"
            full
            disabled={!Object.keys(changes).length || !nameValid || busy}
            loading={update.isPending}
            onPress={save}
          >
            {t('adminShop.catalog.edit.save')}
          </Button>
          <Button variant="ghost" icon={Trash2} full disabled={busy} onPress={() => setConfirmDelete(true)}>
            {t('adminShop.catalog.edit.delete')}
          </Button>
        </View>
      )}
    </View>
  );
}
