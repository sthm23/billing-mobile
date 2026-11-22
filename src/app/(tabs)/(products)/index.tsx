import ProductListScreen from '@/screens/product/ProductListScreen';
import { SafeAreaView } from '@/components/base/SafeAreaView';

export default function ProductsScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <ProductListScreen />
    </SafeAreaView>
  );
}
