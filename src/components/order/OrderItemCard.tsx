import { Money, PhotoPlaceholder, StatusBadge, Stepper, Text } from '@/components/base';
import { OrderDetailItem } from '@/services/order/order.type';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface OrderItemCardProps {
  item: OrderDetailItem;
  index: number;
  showDivider: boolean;
  onQuantityChange?: (itemId: string, delta: number) => void;
}

/**
 * Order line: photo, SKU and barcode, stock, prices and quantity stepper.
 */
export function OrderItemCard({ item, onQuantityChange }: OrderItemCardProps) {
  const { t } = useTranslation();
  const hasDiscount = item.sale > 0;
  const maxStock = item.variant.quantity;

  return (
    <View className="flex-row items-center gap-3 bg-card rounded-xl p-2.5 pr-3">
      <PhotoPlaceholder size="lg" />

      <View className="flex-1 min-w-0 gap-1">
        <Text className="type-body-strong text-ink" numberOfLines={1}>
          {item.variant.sku}
        </Text>
        <Text className="font-onest text-xs text-muted tabular-nums" numberOfLines={1}>
          {item.variant.barCode}
        </Text>
        <StatusBadge
          label={`${t('product.inStockLabel')}: ${maxStock}`}
          tone={maxStock === 0 ? 'err' : 'ok'}
          size="sm"
        />
        <View className="flex-row items-baseline flex-wrap gap-x-2">
          <Money value={item.costAtSale} currency={null} className="text-[15px]" />
          {hasDiscount && (
            <Money
              value={item.retailPrice}
              currency={null}
              className="font-onest-medium text-xs text-muted line-through"
            />
          )}
        </View>
      </View>

      <Stepper
        value={item.quantity}
        onChange={(next) => onQuantityChange?.(item.id, next - item.quantity)}
        max={maxStock}
        vertical
        size="sm"
      />
    </View>
  );
}
