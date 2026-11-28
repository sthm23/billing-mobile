import { SafeAreaView } from '@/components/base/SafeAreaView';
import { OnlineOrderScreen } from '@/screens/online-orders/OnlineOrderScreen';
import { useLocalSearchParams } from 'expo-router';

/** Card of one request from the Telegram shop. */
export default function OnlineOrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <OnlineOrderScreen id={id} />
    </SafeAreaView>
  );
}
