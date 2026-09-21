import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { formatPrice } from '@/libs/product-utils';

interface PriceLabelProps {
  price: number | string;
  prefix?: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function PriceLabel({ price, prefix, unit, size = 'md' }: PriceLabelProps) {
  const textSize = sizeMap[size];

  return (
    <HStack className="items-baseline gap-1 flex-wrap">
      {prefix && (
        <Text className={`${textSize} text-foreground`}>{prefix}</Text>
      )}
      <Text className={`${textSize} font-bold text-foreground`}>
        {formatPrice(price)} UZS
      </Text>
      {unit && (
        <Text className="text-sm text-typography-500">{unit}</Text>
      )}
    </HStack>
  );
}
