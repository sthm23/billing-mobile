import { OrderSearchScreen } from '@/screens/order/cart/OrderSearchScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderSearchPage() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <OrderSearchScreen />
    </SafeAreaView>
  );
}
