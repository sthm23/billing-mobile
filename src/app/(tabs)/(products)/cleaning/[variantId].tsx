import { SafeAreaView } from '@/components/base/SafeAreaView';
import { CleaningNewScreen } from '@/screens/rental/CleaningNewScreen';
import { VariantLoader } from '@/screens/rental/VariantLoader';
import { useLocalSearchParams } from 'expo-router';

/** «В химчистку» for a rented variant (`?productId`), OWNER/MANAGER */
export default function CleaningNewPage() {
  const { variantId, productId } = useLocalSearchParams<{ variantId: string; productId: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <VariantLoader productId={productId ?? ''} variantId={variantId ?? ''}>
        {(product, variant) => <CleaningNewScreen product={product} variant={variant} />}
      </VariantLoader>
    </SafeAreaView>
  );
}
