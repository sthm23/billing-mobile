import { HStack, VStack, Text } from '@/components/base';
import { formatPrice } from '@/libs/product-utils';
import { useTranslation } from 'react-i18next';

interface PricePairProps {
  costPrice: number;
  retailPrice: number;
}

export function PricePair({ costPrice, retailPrice }: PricePairProps) {
  const { t } = useTranslation();

  return (
    <HStack className="gap-8">
      <VStack className="gap-0.5">
        <Text className="text-xs text-typography-500">{t('product.costPrice')}</Text>
        <Text className="text-base font-bold text-foreground">
          {formatPrice(costPrice)} {t('common.currency')}
        </Text>
      </VStack>
      <VStack className="gap-0.5">
        <Text className="text-xs text-typography-500">{t('product.retailPriceLabel')}</Text>
        <Text className="text-base font-bold text-foreground">
          {formatPrice(retailPrice)} {t('common.currency')}
        </Text>
      </VStack>
    </HStack>
  );
}
