import { SafeAreaView } from '@/components/base/SafeAreaView';
import { ProductCardFormScreen } from '@/screens/product/form/ProductCardFormScreen';

/** New product, step 1 — the card */
export default function ProductCreateRoute() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <ProductCardFormScreen />
    </SafeAreaView>
  );
}
