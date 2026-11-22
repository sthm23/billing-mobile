import { Button, IconButton, Text, toast } from '@/components/base';
import { Sheet, SheetTextInput } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import type { AdminStoreAttribute } from '@/services/admin-store/admin-store.types';
import { useUpdateAttribute } from '@/services/category';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const INPUT_CLASS = 'h-[52px] px-4 rounded-2xl bg-sunken font-onest text-base text-ink';
/** Same limits as the backend (`ATTRIBUTE_NAME_MIN/MAX`) */
const NAME_MIN = 2;
const NAME_MAX = 60;

interface AttributeEditSheetProps {
  /** The attribute being edited; null — closed */
  attribute: AdminStoreAttribute | null;
  onClose: () => void;
}

const clean = (value: string) => value.trim().replace(/\s+/g, ' ');

/**
 * ADMIN: rename an attribute of the shared dictionary / set its uz, en translations
 * (`PATCH /category/attribute/:id`). The type and unit don't change; 409 / 400 come with a message.
 */
export function AttributeEditSheet({ attribute, onClose }: AttributeEditSheetProps) {
  return (
    <Sheet isOpen={!!attribute} onClose={onClose} size="auto">
      {/* Remounted per attribute, so the fields start from its names */}
      {attribute ? <AttributeForm key={attribute.id} attribute={attribute} onClose={onClose} /> : <View />}
    </Sheet>
  );
}

function AttributeForm({ attribute, onClose }: { attribute: AdminStoreAttribute; onClose: () => void }) {
  const { t } = useTranslation();
  const colors = useTheme();
  const update = useUpdateAttribute();
  const [name, setName] = useState(attribute.name);
  const [nameUz, setNameUz] = useState(attribute.nameUz ?? '');
  const [nameEn, setNameEn] = useState(attribute.nameEn ?? '');
  const [error, setError] = useState<string | null>(null);

  // Send only the changed fields; an empty translation clears it
  const changes = {
    ...(clean(name) !== attribute.name ? { name: clean(name) } : {}),
    ...(clean(nameUz) !== (attribute.nameUz ?? '') ? { nameUz: clean(nameUz) } : {}),
    ...(clean(nameEn) !== (attribute.nameEn ?? '') ? { nameEn: clean(nameEn) } : {}),
  };
  const nameValid =
    clean(name).length >= NAME_MIN && [nameUz, nameEn].every((v) => !clean(v) || clean(v).length >= NAME_MIN);

  const save = () => {
    setError(null);
    update.mutate(
      { id: attribute.id, ...changes },
      {
        onSuccess: () => {
          toast.show(t('adminShop.catalog.attrEdit.saved'));
          onClose();
        },
        onError: (e) => setError(getApiErrorMessage(e, t('adminShop.catalog.edit.saveFailed'))),
      },
    );
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
          <Text className="type-title text-ink" accessibilityRole="header">{t('adminShop.catalog.attrEdit.title')}</Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={2}>
            {t('adminShop.catalog.attrEdit.subtitle')}
          </Text>
        </View>
        <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
      </View>

      {field(t('adminShop.catalog.edit.nameRu'), name, setName, false)}
      {field(t('adminShop.catalog.edit.nameUz'), nameUz, setNameUz, true)}
      {field(t('adminShop.catalog.edit.nameEn'), nameEn, setNameEn, true)}

      {error ? (
        <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
          <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
        </View>
      ) : null}

      <Button
        size="lg"
        full
        disabled={!Object.keys(changes).length || !nameValid || update.isPending}
        loading={update.isPending}
        onPress={save}
      >
        {t('adminShop.catalog.edit.save')}
      </Button>
    </View>
  );
}
