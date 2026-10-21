import { OrderCartScreen } from '@/screens/order/cart/OrderCartScreen';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from '@/components/base/SafeAreaView';

/**
 * New sale. `?scan=1` (BottomNav scan button) opens the scanner right away;
 * `?keep=1` keeps the cart filled from a product card.
 */
export default function CreateOrderPage() {
  const { scan, keep } = useLocalSearchParams<{ scan?: string; keep?: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <OrderCartScreen startScan={scan === '1'} keepCart={keep === '1'} />
    </SafeAreaView>
  );
}
