import { useTheme } from '@/hooks/use-theme';
import OrderPage from '@/screens/order/OrderPage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  const color = useTheme();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.background }}>
      <OrderPage />
    </SafeAreaView>
  );
}

