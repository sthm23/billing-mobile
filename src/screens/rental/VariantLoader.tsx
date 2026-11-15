import { Button } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import type { ProductDetail, ProductVariant } from '@/models/product.model';
import { useProductById } from '@/services/product/product.queries';
import { router } from 'expo-router';
import { PackageX } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface VariantLoaderProps {
  productId: string;
  variantId: string;
  children: (product: ProductDetail, variant: ProductVariant) => ReactNode;
}

/** Loads a product (`GET /product/:id`) and renders one of its variants, with loading / not found states */
export function VariantLoader({ productId, variantId, children }: VariantLoaderProps) {
  const { t } = useTranslation();
  const { data: product, isLoading, isError } = useProductById(productId);
  const variant = product?.variants.find((v) => v.id === variantId);

  if (isLoading) return <LoadingState />;
  if (isError || !product || !variant) {
    return (
      <EmptyState icon={PackageX} message={isError ? t('product.errorLoading') : t('product.notFound')}>
        <Button variant="secondary" onPress={() => router.back()}>
          {t('common.back')}
        </Button>
      </EmptyState>
    );
  }
  return <>{children(product, variant)}</>;
}
