import { Box } from '@/components/ui/box';
import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { OrderDetailItem } from '@/services/order/order.type';

interface OrderItemCardProps {
  item: OrderDetailItem;
  index: number;
  showDivider: boolean;
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function OrderItemCard({ item, index, showDivider }: OrderItemCardProps) {
  return (
    <Box>
      {showDivider && <Divider className="my-3" />}
      <HStack className="justify-between items-start">
        <VStack className="flex-1">
          <HStack className="items-center gap-2 mb-1">
            <Box className="bg-primary/10 px-2 py-0.5 rounded">
              <Text className="text-xs font-medium text-primary">
                #{index + 1}
              </Text>
            </Box>
            <Text className="text-sm font-semibold text-foreground flex-1">
              {item.variant.sku}
            </Text>
          </HStack>

          <Text className="text-xs text-typography-500 mb-1">
            Код: {item.variant.barCode}
          </Text>

          <HStack className="gap-4 mt-1">
            <HStack className="items-center gap-1">
              <Text className="text-xs text-typography-400">Кол-во:</Text>
              <Text className="text-xs font-medium text-foreground">
                {item.quantity} шт
              </Text>
            </HStack>

            <HStack className="items-center gap-1">
              <Text className="text-xs text-typography-400">Цена:</Text>
              <Text className="text-xs font-medium text-foreground">
                {formatAmount(item.costAtSale)} UZS
              </Text>
            </HStack>

            {item.sale > 0 && (
              <HStack className="items-center gap-1 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded">
                <Text className="text-xs font-medium text-red-600 dark:text-red-400">
                  -{item.sale}%
                </Text>
              </HStack>
            )}
          </HStack>
        </VStack>

        <VStack className="items-end ml-3">
          <Text className="text-base font-bold text-foreground">
            {formatAmount(item.costAtSale * item.quantity)}
          </Text>
          <Text className="text-xs text-typography-400">UZS</Text>
          {item.sale > 0 && (
            <Text className="text-xs text-typography-400 line-through mt-0.5">
              {formatAmount(item.retailPrice * item.quantity)}
            </Text>
          )}
        </VStack>
      </HStack>
    </Box>
  );
}
