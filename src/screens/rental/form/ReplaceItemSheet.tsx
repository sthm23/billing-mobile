import { Button, IconButton, StatusBadge, Text } from '@/components/base';
import { Sheet, SheetScrollView } from '@/components/base/Sheet';
import { EmptyState } from '@/components/common';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/libs/format';
import { cn } from '@/libs/utils';
import { useSimilarVariants, type SimilarVariant } from '@/services/rental';
import { Shirt, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

export interface ReplaceTarget {
  variantId: string;
  name: string;
  quantity: number;
}

interface ReplaceItemSheetProps {
  target: ReplaceTarget | null;
  warehouseId: string;
  startDate: string;
  endDate: string;
  excludeRentalId?: string;
  /** Variants already in the booking (can't be picked twice) */
  addedIds: string[];
  onClose: () => void;
  onReplace: (variant: SimilarVariant) => void;
}

/**
 * «Заменить вещь» (design «Аренда · замена»): other sizes of the product and
 * similar items of its category, free ones first — from GET /rental/similar.
 */
export function ReplaceItemSheet({
  target,
  warehouseId,
  startDate,
  endDate,
  excludeRentalId,
  addedIds,
  onClose,
  onReplace,
}: ReplaceItemSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [selected, setSelected] = useState<SimilarVariant | null>(null);
  const { data, isLoading, isError } = useSimilarVariants(
    target ? { warehouseId, variantId: target.variantId, startDate, endDate, excludeRentalId } : null,
  );

  useEffect(() => setSelected(null), [target]);

  const sections = [
    { key: 'product', title: t('rental.replace.sameProduct', { name: target?.name ?? '' }), rows: data?.sameProduct ?? [] },
    { key: 'category', title: t('rental.replace.sameCategory'), rows: data?.sameCategory ?? [] },
  ].filter((section) => section.rows.length > 0);

  return (
    <Sheet isOpen={!!target} onClose={onClose}>
      <View className="flex-1 px-4 pt-2 gap-3">
        <View className="flex-row items-start gap-2">
          <View className="flex-1 min-w-0 gap-0.5">
            <Text className="type-title text-ink" accessibilityRole="header">{t('rental.replace.title')}</Text>
            <Text className="font-onest text-[13px] text-muted">{t('rental.replace.subtitle', { name: target?.name ?? '' })}</Text>
          </View>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.muted} className="pt-6" />
        ) : isError ? (
          <EmptyState icon={Shirt} message={t('rental.replace.loadFailed')} />
        ) : sections.length === 0 ? (
          <EmptyState icon={Shirt} message={t('rental.replace.empty')} />
        ) : (
          <SheetScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 12, gap: 8 }}>
            {sections.map((section) => (
              <View key={section.key} className="gap-2">
                <Text className="font-onest-bold text-[13px] text-soft px-1 pt-1">{section.title}</Text>
                {section.rows.map((row) => {
                  const free = row.available >= (target?.quantity ?? 1) && !addedIds.includes(row.variantId);
                  const on = selected?.variantId === row.variantId;
                  const attrs = row.attributes.map((a) => a.value).filter(Boolean).join(' · ');
                  return (
                    <Pressable
                      key={row.variantId}
                      onPress={() => setSelected(row)}
                      disabled={!free}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on, disabled: !free }}
                      className={cn(
                        'flex-row items-center gap-3 p-3 rounded-lg',
                        on ? 'bg-primary' : 'bg-sunken',
                        !free && 'opacity-50',
                      )}
                    >
                      <View className="flex-1 min-w-0 gap-1">
                        <Text className={cn('type-body-strong', on ? 'text-on-primary' : 'text-ink')} numberOfLines={1}>
                          {row.productName}
                        </Text>
                        <Text className={cn('font-onest text-xs', on ? 'text-on-primary' : 'text-muted')} numberOfLines={1}>
                          {[attrs || row.sku, t('rental.replace.perDay', { amount: formatMoney(row.rentPricePerDay) })].join(' · ')}
                        </Text>
                        <StatusBadge
                          size="sm"
                          className="self-start"
                          label={
                            addedIds.includes(row.variantId)
                              ? t('rental.replace.inBooking')
                              : free
                                ? t('rental.form.freeOf', { available: row.available, owned: row.owned })
                                : t('rental.form.busy')
                          }
                          tone={free ? 'ok' : 'err'}
                        />
                      </View>
                      <View
                        className={cn(
                          'w-6 h-6 rounded-full',
                          on ? 'border-[7px] border-accent bg-card' : 'border-[1.5px] border-muted',
                        )}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </SheetScrollView>
        )}

        <Button
          variant="accent"
          size="lg"
          full
          disabled={!selected}
          onPress={() => selected && onReplace(selected)}
          className="mb-3"
        >
          {selected ? t('rental.replace.confirm', { name: selected.productName }) : t('rental.replace.pick')}
        </Button>
      </View>
    </Sheet>
  );
}
