import { Box, Divider, HStack, Pressable, Text, VStack } from '@/components/base';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
import { OrderDetailItem } from '@/services/order/order.type';

interface OrderItemCardProps {
  item: OrderDetailItem;
  index: number;
  showDivider: boolean;
  onQuantityChange?: (itemId: string, delta: number) => void;
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const BG_COLORS = ['#3B82F6', '#22C55E', '#A855F7', '#F97316', '#EC4899'];

export function OrderItemCard({ item, index, showDivider, onQuantityChange }: OrderItemCardProps) {
  const discountAmount = Math.round(item.retailPrice * (item.sale / 100));
  const hasDiscount = item.sale > 0;
  const maxStock = item.variant.quantity;
  const bgColor = BG_COLORS[index % BG_COLORS.length];
  const initial = item.variant.sku?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <Box className="bg-background">
      {showDivider && <Divider className="mx-4" />}
      <HStack className="px-4 py-3 gap-3 items-center">
        {/* Product image placeholder */}
        <Box
          style={{ backgroundColor: bgColor, width: 64, height: 64, borderRadius: 12 }}
          className="items-center justify-center shrink-0 overflow-hidden"
        >
          <Text className="text-white text-2xl font-bold">{initial}</Text>
        </Box>

        {/* Product info */}
        <VStack className="flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {item.variant.sku}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {item.variant.barCode}
          </Text>

          {/* Prices row */}
          <HStack className="gap-2 items-center mt-0.5 flex-wrap">
            {hasDiscount && (
              <Text className="text-xs text-muted-foreground line-through">
                {formatAmount(item.retailPrice)} UZS
              </Text>
            )}
            {hasDiscount && (
              <Text className="text-xs font-medium text-red-500">
                -{formatAmount(discountAmount)} UZS
              </Text>
            )}
            <Text className="text-sm font-bold text-foreground">
              {formatAmount(item.costAtSale)} UZS
            </Text>
          </HStack>

          {/* Quantity stepper */}
          <HStack className="items-center gap-2 mt-1">
            <Pressable
              className="w-7 h-7 rounded-full border border-border items-center justify-center active:opacity-70"
              onPress={() => onQuantityChange?.(item.id, -1)}
            >
              <CustomIcon name={IconNames.MINUS} size={16} />
            </Pressable>

            <Text className="text-sm font-medium text-foreground min-w-12 text-center">
              {item.quantity}/{maxStock}
            </Text>

            <Pressable
              className="w-7 h-7 rounded-full border border-border items-center justify-center active:opacity-70"
              onPress={() => onQuantityChange?.(item.id, 1)}
            >
              <CustomIcon name={IconNames.PLUS} size={16} />
            </Pressable>
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
}
