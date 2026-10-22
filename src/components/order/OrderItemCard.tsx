import { Money, PhotoPlaceholder, Pressable, StatusBadge, Stepper, Text } from '@/components/base';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export interface OrderItemCardProps {
  name: string;
  /** Attribute values or SKU */
  variantLabel: string;
  /** Unit price after the discount */
  price: number;
  /** Catalogue price, shown struck through when the price was changed */
  basePrice?: number;
  quantity: number;
  /** Stock hint; omit to hide the badge (read-only orders) */
  stock?: number;
  /** Opens the price sheet */
  onPress?: () => void;
  /** Shows the quantity stepper */
  onQuantityChange?: (quantity: number) => void;
}

const LOW_STOCK = 5;

/**
 * Order line: photo, name, variant, stock badge, price and quantity.
 */
export function OrderItemCard({
  name,
  variantLabel,
  price,
  basePrice,
  quantity,
  stock,
  onPress,
  onQuantityChange,
}: OrderItemCardProps) {
  const { t } = useTranslation();
  const changed = basePrice !== undefined && basePrice !== price;

  const stockBadge =
    stock === undefined
      ? null
      : quantity > stock
        ? { label: t('sale.cart.overStock', { count: stock }), tone: 'err' as const }
        : stock <= LOW_STOCK
          ? { label: t('sale.cart.stockLow', { count: stock }), tone: 'warn' as const }
          : { label: t('sale.cart.inStock', { count: stock }), tone: 'ok' as const };

  return (
    <View className="flex-row items-center gap-2.5 bg-card rounded-lg p-2.5">
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `${name}, ${t('sale.price.title')}` : undefined}
        className="flex-1 min-w-0 flex-row items-center gap-3"
      >
        <PhotoPlaceholder size="lg" />
        <View className="flex-1 min-w-0 gap-1">
          <Text className="font-onest-semibold text-[15px] text-ink" numberOfLines={2}>{name}</Text>
          <View className="flex-row items-center flex-wrap gap-1.5">
            <Text className="font-onest text-xs text-muted" numberOfLines={1}>{variantLabel}</Text>
            {stockBadge && <StatusBadge label={stockBadge.label} tone={stockBadge.tone} size="sm" />}
          </View>
          <View className="flex-row items-baseline flex-wrap gap-x-1.5">
            <Money value={price} currency={null} className="text-[15px]" />
            {changed && (
              <Money value={basePrice} currency={null} className="font-onest text-xs text-muted line-through" />
            )}
            {!onQuantityChange && (
              <Text className="font-onest text-xs text-muted">× {quantity}</Text>
            )}
          </View>
        </View>
      </Pressable>

      {onQuantityChange && (
        <Stepper value={quantity} onChange={onQuantityChange} min={1} vertical size="sm" />
      )}
    </View>
  );
}
