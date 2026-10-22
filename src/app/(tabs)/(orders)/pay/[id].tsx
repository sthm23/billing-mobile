import { OrderPayScreen } from '@/screens/order/pay/OrderPayScreen';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from '@/components/base/SafeAreaView';

export default function OrderPayPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <OrderPayScreen orderId={id} />
    </SafeAreaView>
  );
}
