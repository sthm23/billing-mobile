import { useTheme } from '@/hooks/use-theme';
import { OrderDetailScreen } from '@/screens/order/OrderDetailScreen';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderDetailPage() {
  const color = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.background }}>
      <OrderDetailScreen orderId={id} />
    </SafeAreaView>
  );
}
