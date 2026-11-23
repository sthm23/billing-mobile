import { OrderSearchScreen } from '@/screens/order/cart/OrderSearchScreen';
import { SafeAreaView } from '@/components/base/SafeAreaView';
import { useLocalSearchParams } from 'expo-router';

export default function OrderSearchPage() {
  // `pick` — row key of the order assistant review («Найти вручную»), `q` — its phrase.
  const { pick, q } = useLocalSearchParams<{ pick?: string; q?: string }>();
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <OrderSearchScreen pickFor={pick} initialQuery={q} />
    </SafeAreaView>
  );
}
