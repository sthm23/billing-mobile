import { OrderDetailScreen } from '@/screens/order/OrderDetailScreen';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from '@/components/base/SafeAreaView';

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <OrderDetailScreen orderId={id} />
    </SafeAreaView>
  );
}
