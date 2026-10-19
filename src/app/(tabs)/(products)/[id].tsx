import { Button } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import ProductDetailScreen from '@/screens/product/ProductDetailScreen';
import { useProductById } from '@/services/product/product.queries';
import { router, useLocalSearchParams } from 'expo-router';
import { PackageX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductDetailRoute() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: product, isLoading, isError } = useProductById(id);

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
      ) : (
        <ProductDetailScreen product={product} />
      )}
    </SafeAreaView>
  );
}
