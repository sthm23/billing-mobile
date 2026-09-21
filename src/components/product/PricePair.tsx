import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { formatPrice } from '@/libs/product-utils';

interface PricePairProps {
  costPrice: number;
  retailPrice: number;
}

export function PricePair({ costPrice, retailPrice }: PricePairProps) {
  return (
    <HStack className="gap-8">
      <VStack className="gap-0.5">
        <Text className="text-xs text-typography-500">Закупочная цена</Text>
        <Text className="text-base font-bold text-foreground">
          {formatPrice(costPrice)} UZS
        </Text>
      </VStack>
      <VStack className="gap-0.5">
        <Text className="text-xs text-typography-500">Продажная цена</Text>
        <Text className="text-base font-bold text-foreground">
          {formatPrice(retailPrice)} UZS
        </Text>
      </VStack>
    </HStack>
  );
}
