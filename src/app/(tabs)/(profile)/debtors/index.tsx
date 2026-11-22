import { SafeAreaView } from '@/components/base/SafeAreaView';
import { DebtorsScreen } from '@/screens/debt/DebtorsScreen';

/** «Должники» — opened from Profile. */
export default function DebtorsRoute() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <DebtorsScreen />
    </SafeAreaView>
  );
}
