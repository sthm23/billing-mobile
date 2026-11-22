import { SafeAreaView } from '@/components/base/SafeAreaView';
import { ProductCardFormScreen } from '@/screens/product/form/ProductCardFormScreen';
import { useLocalSearchParams } from 'expo-router';

/** Edit the product card (step 1 form in edit mode) */
export default function ProductEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <ProductCardFormScreen productId={id} />
    </SafeAreaView>
  );
}
