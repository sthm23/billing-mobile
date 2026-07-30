import { useTheme } from '@/hooks/use-theme';
import ProductPage from '@/screens/product/Productpage';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function ProductsScreen() {
  const colors = useTheme();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ProductPage />
    </SafeAreaView>
  );
}
