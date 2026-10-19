import { Button, Money, Text } from '@/components/base';
import { ProductVariant, StockMovementType } from '@/models/product.model';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface ProductVariantCardProps {
  variant: ProductVariant;
  nameById?: Record<string, string>;
  onHistory?: (variantId: string) => void;
  onMovement?: (variantId: string) => void;
}

function getVariantLabel(variant: ProductVariant): string {
  const attrs = variant.attributes ?? [];
  if (attrs.length === 0) return variant.sku;
  return attrs.map((a) => String(a.value)).join(' · ');
}

function getLatestCostPrice(variant: ProductVariant): number {
  const lastIn = (variant.stockMovements ?? [])
    .filter((m) => m.type === StockMovementType.IN)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return lastIn ? parseFloat(lastIn.unitCost) : 0;
}

/**
 * Variant block for staff: attributes, SKU, stock, purchase and sale price.
 */
export function ProductVariantCard({ variant, onHistory, onMovement }: ProductVariantCardProps) {
  const { t } = useTranslation();
  const costPrice = getLatestCostPrice(variant);
  const retailPrice = parseFloat(String(variant.price));
  const outOfStock = variant.quantity === 0;

  return (
    <View className="bg-card rounded-xl p-4 gap-3.5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text className="type-body-strong text-ink">{getVariantLabel(variant)}</Text>
          <Text className="font-onest text-xs text-muted tabular-nums">{variant.sku}</Text>
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
          <Text className="font-onest text-xs text-muted">{t('product.retailPriceLabel')}</Text>
          <Money value={retailPrice} currency={null} className="font-onest-semibold text-[15px]" />
        </View>
      </View>

      <View className="flex-row gap-2">
        <Button variant="secondary" className="flex-1" onPress={() => onHistory?.(variant.id)}>
          {t('product.history')}
        </Button>
        <Button variant="primary" className="flex-1" onPress={() => onMovement?.(variant.id)}>
          {t('product.stockMovementButton')}
        </Button>
      </View>
    </View>
  );
}
