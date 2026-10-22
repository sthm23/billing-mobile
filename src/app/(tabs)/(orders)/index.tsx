import OrderPage from '@/screens/order/OrderPage';
import { SafeAreaView } from '@/components/base/SafeAreaView';

export default function OrdersScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <OrderPage />
    </SafeAreaView>
  );
}
