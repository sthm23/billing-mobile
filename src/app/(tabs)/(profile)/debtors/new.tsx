import { SafeAreaView } from '@/components/base/SafeAreaView';
import { DebtNewScreen } from '@/screens/debt/DebtNewScreen';

/** «Новый долг» — manual debt from before STHM (owner/manager). */
export default function DebtNewRoute() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <DebtNewScreen />
    </SafeAreaView>
  );
}
