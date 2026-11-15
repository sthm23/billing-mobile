import { Button, Chip, IconButton, Pressable, Switch, Text } from '@/components/base';
import { Sheet, SheetTextInput } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import type { AttributeType, CatalogBrand, NewStoreAttribute } from '@/services/admin-store';
import { X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const INPUT_CLASS = 'h-[52px] px-4 rounded-2xl bg-sunken font-onest text-base text-ink';
const ATTRIBUTE_TYPES: AttributeType[] = ['STRING', 'NUMBER', 'BOOLEAN'];
/** Existing brands suggested while typing (the sheet does not scroll) */
const MAX_SUGGESTIONS = 6;

function Header({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-start gap-2">
      <View className="flex-1 min-w-0 gap-0.5">
        <Text className="type-title text-ink" accessibilityRole="header">{title}</Text>
        {subtitle ? <Text className="font-onest text-[13px] text-muted">{subtitle}</Text> : null}
      </View>
      <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
    </View>
  );
}

interface BrandSheetProps {
  isOpen: boolean;
  onClose: () => void;
  brands: CatalogBrand[];
  /** Names already in the form (case-insensitive) */
  selected: string[];
  onAdd: (name: string) => void;
}

/** «+ Бренд»: pick an existing brand or add a new name (created on save, global) */
export function BrandSheet({ isOpen, onClose, brands, selected, onAdd }: BrandSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) setName('');
  }, [isOpen]);

  const query = name.trim().toLowerCase();
  const taken = useMemo(() => new Set(selected.map((s) => s.toLowerCase())), [selected]);
  const suggestions = useMemo(
    () =>
      brands
        .filter((b) => !taken.has(b.name.toLowerCase()) && (!query || b.name.toLowerCase().includes(query)))
        .slice(0, MAX_SUGGESTIONS),
    [brands, taken, query],
  );
  const exact = brands.find((b) => b.name.toLowerCase() === query);
  const isTaken = !!query && taken.has(query);

  const add = (value: string) => {
    onAdd(value.trim());
    onClose();
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <Header title={t('adminShopNew.brand.title')} subtitle={t('adminShopNew.brand.subtitle')} onClose={onClose} />
        <SheetTextInput
          value={name}
          onChangeText={setName}
          placeholder={t('adminShopNew.brand.placeholder')}
          placeholderTextColor={colors.muted}
          className={INPUT_CLASS}
          maxLength={60}
          accessibilityLabel={t('adminShopNew.brand.title')}
        />
        {suggestions.length ? (
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map((b) => (
              <Chip key={b.id} label={b.name} tone="sunken" onPress={() => add(b.name)} />
            ))}
          </View>
        ) : null}
        {isTaken ? (
          <Text className="font-onest text-[13px] text-muted">{t('adminShopNew.brand.already')}</Text>
        ) : null}
        <Button variant="accent" size="lg" full disabled={!query || isTaken} onPress={() => add(exact?.name ?? name)}>
          {exact || !query ? t('adminShopNew.brand.add') : t('adminShopNew.brand.addNew', { name: name.trim() })}
        </Button>
      </View>
    </Sheet>
  );
}

interface AttributeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Returns an error text or null when the attribute was added */
  onAdd: (attr: NewStoreAttribute) => string | null;
}

/**
 * «Новый атрибут» (a group, e.g. «Материал»): name, value type Текст / Число /
 * Да-Нет, unit for numbers. Values (Хлопок, Шёлк) are added with products.
 */
export function AttributeSheet({ isOpen, onClose, onAdd }: AttributeSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [name, setName] = useState('');
  const [type, setType] = useState<AttributeType>('STRING');
  const [unit, setUnit] = useState('');
  const [preview, setPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setType('STRING');
    setUnit('');
    setError(null);
  }, [isOpen]);

  const trimmed = name.trim();
  const submit = () => {
    const err = onAdd({ name: trimmed, type, unit: type === 'NUMBER' ? unit.trim() || undefined : undefined });
    if (err) {
      setError(err);
      return;
    }
    onClose();
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <Header title={t('adminShopNew.attr.title')} subtitle={t('adminShopNew.attr.subtitle')} onClose={onClose} />
        <View className="gap-1.5">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('adminShopNew.attr.name')}</Text>
          <SheetTextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              setError(null);
            }}
            placeholder={t('adminShopNew.attr.namePlaceholder')}
            placeholderTextColor={colors.muted}
            className={INPUT_CLASS}
            maxLength={60}
            accessibilityLabel={t('adminShopNew.attr.name')}
          />
        </View>
        <View className="gap-1.5">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('adminShopNew.attr.type')}</Text>
          <View className="flex-row gap-2" accessibilityRole="radiogroup">
            {ATTRIBUTE_TYPES.map((y) => {
              const on = y === type;
              return (
                <Pressable
                  key={y}
                  onPress={() => setType(y)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  className={cn('flex-1 rounded-2xl px-3 py-2.5 gap-0.5', on ? 'bg-primary' : 'bg-sunken')}
                >
                  <Text className={cn('font-onest-semibold text-sm', on ? 'text-on-primary' : 'text-ink')}>
                    {t(`adminShopNew.attr.types.${y}`)}
                  </Text>
                  <Text className={cn('font-onest text-[11px]', on ? 'text-on-primary opacity-70' : 'text-muted')}>
                    {t(`adminShopNew.attr.typesDesc.${y}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {type === 'NUMBER' ? (
          <View className="gap-1.5">
            <Text className="font-onest-semibold text-[13px] text-soft">{t('adminShopNew.attr.unit')}</Text>
            <SheetTextInput
              value={unit}
              onChangeText={setUnit}
              placeholder={t('adminShopNew.attr.unitPlaceholder')}
              placeholderTextColor={colors.muted}
              className={INPUT_CLASS}
              maxLength={20}
              accessibilityLabel={t('adminShopNew.attr.unit')}
            />
            <Text className="font-onest text-xs text-muted">
              {t('adminShopNew.attr.unitHint', { name: trimmed || t('adminShopNew.attr.unitHintName'), unit: unit.trim() || '…' })}
            </Text>
          </View>
        ) : null}
        {type === 'STRING' ? (
          <View className="bg-sunken rounded-2xl px-3.5 py-3">
            <Text className="font-onest text-[13px] leading-[18px] text-soft">{t('adminShopNew.attr.stringHint')}</Text>
          </View>
        ) : null}
        {type === 'BOOLEAN' ? (
          <View className="flex-row items-center gap-3 bg-sunken rounded-2xl px-3.5 py-3">
            <View className="flex-1 gap-0.5">
              <Text className="font-onest text-[11px] text-muted">{t('adminShopNew.attr.boolPreview')}</Text>
              <Text className="font-onest-semibold text-sm text-ink">{trimmed || t('adminShopNew.attr.namePlaceholder')}</Text>
            </View>
            <Switch value={preview} onValueChange={setPreview} accessibilityLabel={trimmed || t('adminShopNew.attr.name')} />
          </View>
        ) : null}
        {error ? (
          <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}
        <Button variant="accent" size="lg" full disabled={!trimmed} onPress={submit}>
          {t('adminShopNew.attr.submit')}
        </Button>
      </View>
    </Sheet>
  );
}
