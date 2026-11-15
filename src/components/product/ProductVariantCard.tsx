import { Button, Money, Text } from '@/components/base';
import { useStoreMode } from '@/hooks/use-store-mode';
import { formatMoney } from '@/libs/format';
import { Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { getLatestCostPrice, getVariantLabel } from '@/libs/product-utils';
import { ProductVariant } from '@/models/product.model';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface ProductVariantCardProps {
  variant: ProductVariant;
  /** Owner/manager: shows the purchase cost, margin and «Приход / Списание» */
  canManage?: boolean;
  onHistory?: (variantId: string) => void;
  onMovement?: (variantId: string) => void;
  /** Opens the rented item card (store with rental enabled) */
  onRental?: (variantId: string) => void;
}

/**
 * Variant block for staff: attributes, SKU, stock, purchase and sale price
 * with margin, «История» and «Приход / Списание».
 */
export function ProductVariantCard({ variant, canManage = false, onHistory, onMovement, onRental }: ProductVariantCardProps) {
  const { t } = useTranslation();
  const { rentalEnabled } = useStoreMode();
  const costPrice = getLatestCostPrice(variant);
  const retailPrice = Number(variant.price);
  const outOfStock = variant.quantity === 0;
  // Display only: margin of the current sale price over the last purchase cost.
  // The backend sends no cost to seller / cashier / warehouse staff.
  const margin =
    canManage && costPrice > 0 && retailPrice > 0 ? Math.round(((retailPrice - costPrice) / retailPrice) * 100) : null;

  return (
    <View className="bg-card rounded-xl p-4 gap-3.5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text className="type-body-strong text-ink">{getVariantLabel(variant)}</Text>
          <Text className="font-onest text-xs text-muted tabular-nums">{variant.barCode || variant.sku}</Text>
        </View>
        <View className="items-end">
          <Text className={outOfStock ? 'font-onest-bold text-xl text-err-fg' : 'font-onest-bold text-xl text-ink'}>
            {variant.quantity}
          </Text>
          <Text className="font-onest text-[11px] text-muted">{t('product.unit')}</Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        {canManage && (
          <View className="flex-1 bg-sunken rounded-[14px] px-3 py-2.5 gap-0.5">
            <Text className="font-onest text-xs text-muted">{t('product.costPrice')}</Text>
            <Money value={costPrice} currency={null} className="font-onest-semibold text-[15px]" />
          </View>
        )}
        <View className="flex-1 bg-sunken rounded-[14px] px-3 py-2.5 gap-0.5">
          <Text className="font-onest text-xs text-muted" numberOfLines={1}>
            {margin === null ? t('product.retailPriceLabel') : t('product.retailWithMargin', { margin })}
          </Text>
          <Money value={retailPrice} currency={null} className="font-onest-semibold text-[15px]" />
        </View>
      </View>

      {rentalEnabled && onRental ? <RentalPriceRow variant={variant} onPress={() => onRental(variant.id)} /> : null}

      <View className="flex-row gap-2">
        <Button variant="secondary" className="flex-1" onPress={() => onHistory?.(variant.id)}>
          {t('product.history')}
        </Button>
        {canManage && (
          <Button variant="primary" className="flex-1" onPress={() => onMovement?.(variant.id)}>
            {t('product.stockMovementButton')}
          </Button>
        )}
      </View>
    </View>
  );
}

/** «Аренда · 200 000 UZS / день» (or «Не сдаётся») — opens the rented item card */
export function RentalPriceRow({ variant, onPress }: { variant: ProductVariant; onPress: () => void }) {
  const { t } = useTranslation();
  const colors = useTheme();
  const rentPrice = Number(variant.rentPricePerDay ?? 0);
  const rented = !!variant.canRent && rentPrice > 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-2 bg-sunken rounded-[14px] px-3 py-2.5 active:opacity-80"
    >
      <View className="flex-1 gap-0.5">
        <Text className="font-onest text-xs text-muted">{t('rental.item.rentRow')}</Text>
        <Text className="font-onest-semibold text-[15px] text-ink">
          {rented ? `${formatMoney(rentPrice)} ${t('rental.item.perDay')}` : t('rental.item.notRented')}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.muted} strokeWidth={2} />
    </Pressable>
  );
}
