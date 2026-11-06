import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalItemFormScreen } from '@/screens/rental/RentalItemFormScreen';
import { VariantLoader } from '@/screens/rental/VariantLoader';
import { useLocalSearchParams } from 'expo-router';

/** «Цена и аренда» of a variant (`?productId`), OWNER/MANAGER */
export default function RentalItemFormPage() {
  const { variantId, productId } = useLocalSearchParams<{ variantId: string; productId: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <VariantLoader productId={productId ?? ''} variantId={variantId ?? ''}>
        {(product, variant) => <RentalItemFormScreen product={product} variant={variant} />}
      </VariantLoader>
    </SafeAreaView>
  );
}
