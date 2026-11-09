import { Button } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalProductScreen } from '@/screens/rental/product/RentalProductScreen';
import { parseRangeParams } from '@/screens/rental/rental-format';
import { useProductById } from '@/services/product/product.queries';
import { router, useLocalSearchParams } from 'expo-router';
import { PackageX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

/**
 * Rental card of a product with this variant selected (`?productId`), in any
 * menu mode — from the sale card's «Аренда» row or a similar item;
 * `&startDate&endDate` — dates already picked.
 */
export default function RentalItemPage() {
  const { t } = useTranslation();
  const { variantId, productId, startDate, endDate } = useLocalSearchParams<{
    variantId: string;
    productId: string;
    startDate?: string;
    endDate?: string;
  }>();
  const { data: product, isLoading, isError, refetch } = useProductById(productId ?? '');
  const found = product?.variants.some((v) => v.id === variantId);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {isLoading ? (
        <LoadingState />
      ) : isError || !product || !found ? (
        <EmptyState icon={PackageX} message={isError ? t('product.errorLoading') : t('product.notFound')}>
          <Button variant="secondary" onPress={() => router.back()}>
            {t('common.back')}
          </Button>
        </EmptyState>
      ) : (
        <RentalProductScreen
          product={product}
          onRefresh={refetch}
          initialVariantId={variantId}
          initialRange={parseRangeParams(startDate, endDate)}
        />
      )}
    </SafeAreaView>
  );
}
