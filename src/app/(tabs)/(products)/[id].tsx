import { Button } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useStoreMode } from '@/hooks/use-store-mode';
import ProductDetailScreen from '@/screens/product/ProductDetailScreen';
import { RentalProductScreen } from '@/screens/rental/product/RentalProductScreen';
import { parseRangeParams } from '@/screens/rental/rental-format';
import { useProductById } from '@/services/product/product.queries';
import { router, useLocalSearchParams } from 'expo-router';
import { PackageX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from '@/components/base/SafeAreaView';

/**
 * Product card: the sale card, or in rental mode (bottom menu «Аренды» or a
 * rental-only store) the rental card; `?variantId&startDate&endDate` — what
 * the rental card shows first.
 */
export default function ProductDetailRoute() {
  const { t } = useTranslation();
  const { id, variantId, startDate, endDate } = useLocalSearchParams<{
    id: string;
    variantId?: string;
    startDate?: string;
    endDate?: string;
  }>();
  const { navMode, rentalEnabled } = useStoreMode();

  const { data: product, isLoading, isError, refetch } = useProductById(id);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {isLoading ? (
        <LoadingState />
      ) : isError || !product ? (
        <EmptyState
          icon={PackageX}
          message={isError ? t('product.errorLoading') : t('product.notFound')}
        >
          <Button variant="secondary" onPress={() => router.back()}>
            {t('common.back')}
          </Button>
        </EmptyState>
      ) : rentalEnabled && navMode === 'rent' ? (
        <RentalProductScreen
          product={product}
          onRefresh={refetch}
          initialVariantId={variantId}
          initialRange={parseRangeParams(startDate, endDate)}
        />
      ) : (
        <ProductDetailScreen product={product} onRefresh={refetch} />
      )}
    </SafeAreaView>
  );
}
