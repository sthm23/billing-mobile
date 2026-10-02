import { HStack, Text } from '@/components/base';
import { formatPrice } from '@/libs/product-utils';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const textSize = sizeMap[size];

  return (
    <HStack className="items-baseline gap-1 flex-wrap">
      {prefix && (
        <Text className={`${textSize} text-foreground`}>{prefix}</Text>
      )}
      <Text className={`${textSize} font-bold text-foreground`}>
        {formatPrice(price)} {t('common.currency')}
      </Text>
      {unit && (
        <Text className="text-sm text-typography-500">{unit}</Text>
      )}
    </HStack>
  );
}
