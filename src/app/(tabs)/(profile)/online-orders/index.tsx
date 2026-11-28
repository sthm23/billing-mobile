import { SafeAreaView } from '@/components/base/SafeAreaView';
import { OnlineOrdersScreen } from '@/screens/online-orders/OnlineOrdersScreen';

/** «Онлайн-заявки» — requests from the Telegram shop; opened from Profile. */
export default function OnlineOrdersRoute() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <OnlineOrdersScreen />
    </SafeAreaView>
  );
}
