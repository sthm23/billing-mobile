import { SafeAreaView } from '@/components/base/SafeAreaView';
import { ProductVariantsScreen } from '@/screens/product/form/ProductVariantsScreen';

/** New product, step 2 — variants (also adds variants to an existing product / draft) */
export default function ProductVariantsRoute() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <ProductVariantsScreen />
    </SafeAreaView>
  );
}
