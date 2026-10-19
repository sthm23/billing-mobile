import ProductListScreen from '@/screens/product/ProductListScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductsScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <ProductListScreen />
    </SafeAreaView>
  );
}
