import { SafeAreaView } from '@/components/base/SafeAreaView';
import { OrderReturnScreen } from '@/screens/order/return/OrderReturnScreen';
import { useLocalSearchParams } from 'expo-router';

/** «Возврат товара» of a sold order (OWNER/MANAGER). */
export default function OrderReturnRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <OrderReturnScreen orderId={id} />
    </SafeAreaView>
  );
}
