import { Button, Money, Text } from '@/components/base';
import { getLatestCostPrice, getVariantLabel } from '@/libs/product-utils';
import { ProductVariant } from '@/models/product.model';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface ProductVariantCardProps {
  variant: ProductVariant;
  /** Owner/manager: shows «Приход / Списание» */
  canManage?: boolean;
  onHistory?: (variantId: string) => void;
  onMovement?: (variantId: string) => void;
}

/**
 * Variant block for staff: attributes, SKU, stock, purchase and sale price
 * with margin, «История» and «Приход / Списание».
 */
export function ProductVariantCard({ variant, canManage = false, onHistory, onMovement }: ProductVariantCardProps) {
  const { t } = useTranslation();
  const costPrice = getLatestCostPrice(variant);
  const retailPrice = Number(variant.price);
  const outOfStock = variant.quantity === 0;
  // Display only: margin of the current sale price over the last purchase cost.
  const margin = costPrice > 0 && retailPrice > 0 ? Math.round(((retailPrice - costPrice) / retailPrice) * 100) : null;

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
        <View className="flex-1 bg-sunken rounded-[14px] px-3 py-2.5 gap-0.5">
          <Text className="font-onest text-xs text-muted">{t('product.costPrice')}</Text>
          <Money value={costPrice} currency={null} className="font-onest-semibold text-[15px]" />
        </View>
        <View className="flex-1 bg-sunken rounded-[14px] px-3 py-2.5 gap-0.5">
          <Text className="font-onest text-xs text-muted" numberOfLines={1}>
            {margin === null ? t('product.retailPriceLabel') : t('product.retailWithMargin', { margin })}
          </Text>
          <Money value={retailPrice} currency={null} className="font-onest-semibold text-[15px]" />
        </View>
      </View>

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
