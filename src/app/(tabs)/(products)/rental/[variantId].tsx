import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalItemScreen } from '@/screens/rental/RentalItemScreen';
import { VariantLoader } from '@/screens/rental/VariantLoader';
import { useLocalSearchParams } from 'expo-router';

/** Rented item card of a variant (`?productId`) */
export default function RentalItemPage() {
  const { variantId, productId } = useLocalSearchParams<{ variantId: string; productId: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <VariantLoader productId={productId ?? ''} variantId={variantId ?? ''}>
        {(product, variant) => <RentalItemScreen product={product} variant={variant} />}
      </VariantLoader>
    </SafeAreaView>
  );
}
