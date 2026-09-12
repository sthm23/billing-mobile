import { useTheme } from '@/hooks/use-theme';
import ProductListScreen from '@/screens/product/ProductListScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductsScreen() {
  const colors = useTheme();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ProductListScreen />
    </SafeAreaView>
  );
}
