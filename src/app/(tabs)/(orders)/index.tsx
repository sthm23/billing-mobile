import OrderPage from '@/screens/order/OrderPage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <OrderPage />
    </SafeAreaView>
  );
}
