import { Text } from '@/components/base';
import { formatMoney } from '@/libs/format';
import { findVariantByAttrs, getVariantAttrs } from '@/libs/product-utils';
import { cn } from '@/libs/utils';
import type { ProductVariant } from '@/models/product.model';
import type { VariantAvailability } from '@/services/rental';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { isRentable } from './rental-product-utils';

interface RentalVariantPickerProps {
  variants: ProductVariant[];
  /** Attribute names in the product's order */
  attributeNames: string[];
  /** Values of each attribute across the variants */
  attributeMap: Record<string, string[]>;
  nameById: Record<string, string>;
  selectedAttrs: Record<string, string>;
  selected: ProductVariant | null;
  /** Free units per variant (backend) on the picked dates, or today */
  availability: Map<string, VariantAvailability>;
  /** Availability is being (re)loaded for new dates */
  loading: boolean;
  /** «на 14 мая – 16 мая» or «сегодня» */
  when: string;
  onSelect: (attrs: Record<string, string>) => void;
}

type PillTone = 'ok' | 'warn' | 'err' | 'neutral' | 'none';

const PILL: Record<PillTone, string> = {
  ok: 'bg-ok-bg',
  warn: 'bg-warn-bg',
  err: 'bg-err-bg',
  neutral: 'bg-sunken',
  none: '',
};
const PILL_TEXT: Record<PillTone, string> = {
  ok: 'text-ok-fg',
  warn: 'text-warn-fg',
  err: 'text-err-fg',
  neutral: 'text-soft',
  none: 'text-muted',
};

/**
 * Variant chips per attribute (design «Аренда · карточка вещи»): each chip
 * shows how many units of the variant it leads to are free on the dates
 * (`2/3`, from the backend), «не сдаётся» or «нет».
 */
export function RentalVariantPicker({
  variants,
  attributeNames,
  attributeMap,
  nameById,
  selectedAttrs,
  selected,
  availability,
  loading,
  when,
  onSelect,
}: RentalVariantPickerProps) {
  const { t } = useTranslation();

  const pillOf = (variant: ProductVariant | null): { label: string; tone: PillTone } => {
    if (!variant) return { label: t('rental.product.pill.none'), tone: 'none' };
    if (!isRentable(variant)) return { label: t('rental.product.pill.notRented'), tone: 'neutral' };
    const a = availability.get(variant.id);
    if (loading || !a) return { label: '…', tone: 'none' };
    const tone: PillTone = a.available === 0 ? 'err' : a.available < a.owned ? 'warn' : 'ok';
    return { label: `${a.available}/${a.owned}`, tone };
  };

  // A value with no variant for the other picks: jump to the first variant that has it
  const pick = (name: string, value: string) => {
    const wanted = { ...selectedAttrs, [name]: value };
    if (findVariantByAttrs(variants, wanted, nameById)) {
      onSelect(wanted);
      return;
    }
    const first = variants.find((v) => getVariantAttrs(v, nameById)[name] === value);
    onSelect(first ? getVariantAttrs(first, nameById) : wanted);
  };

  const price = Number(selected?.rentPricePerDay ?? 0);
  const meta = selected
    ? isRentable(selected)
      ? t('rental.product.variantMeta', { price: formatMoney(price), count: selected.quantity })
      : t('rental.product.variantMetaNotRented', { count: selected.quantity })
    : t('rental.product.chooseVariant');

  return (
    <View className="bg-card rounded-xl px-3.5 py-4 gap-3.5">
      <View className="flex-row items-baseline justify-between px-0.5">
        <Text className="font-onest-bold text-[15px] text-ink">{t('rental.product.variant')}</Text>
        <Text className="font-onest text-xs text-muted">{t('rental.product.freeWhen', { when })}</Text>
      </View>

      {attributeNames.map((name) => {
        const values = attributeMap[name] ?? [];
        if (values.length === 0) return null;
        return (
          <View key={name} className="gap-2">
            <Text className="font-onest-semibold text-[13px] text-soft px-0.5">{name}</Text>
            <View className="flex-row flex-wrap gap-1.5" accessibilityRole="radiogroup">
              {values.map((value) => {
                const on = selectedAttrs[name] === value;
                const variant = findVariantByAttrs(variants, { ...selectedAttrs, [name]: value }, nameById);
                const pill = pillOf(variant);
                return (
                  <Pressable
                    key={value}
                    onPress={() => pick(name, value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${name} ${value}: ${pill.label}`}
                    className={cn(
                      'min-w-[72px] h-[60px] px-3 rounded-lg items-center justify-center gap-1 active:opacity-80',
                      on ? 'bg-primary' : 'bg-sunken',
                      !variant && 'opacity-50',
                    )}
                  >
                    <Text className={cn('font-onest-bold text-[17px]', on ? 'text-on-primary' : 'text-ink')}>{value}</Text>
                    <View className={cn('px-1.5 rounded-full', PILL[pill.tone])}>
                      <Text
                        className={cn(
                          'font-onest-bold text-[11px] tabular-nums',
                          pill.tone === 'none' && on ? 'text-on-primary' : PILL_TEXT[pill.tone],
                        )}
                      >
                        {pill.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <View className="flex-row items-center gap-2 px-3 py-2.5 rounded-[14px] bg-sunken">
        {selected && attributeNames.length > 0 ? (
          <Text className="font-onest-bold text-[13px] text-ink" numberOfLines={1}>
            {attributeNames.map((n) => selectedAttrs[n]).filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        <Text className="flex-1 font-onest text-[13px] text-soft" numberOfLines={2}>
          {meta}
        </Text>
      </View>
    </View>
  );
}
