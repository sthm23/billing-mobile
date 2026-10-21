import { OrderCartScreen } from '@/screens/order/cart/OrderCartScreen';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * New sale. `?scan=1` (BottomNav scan button) opens the scanner right away.
 */
export default function CreateOrderPage() {
  const { scan } = useLocalSearchParams<{ scan?: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <OrderCartScreen startScan={scan === '1'} />
    </SafeAreaView>
  );
}
