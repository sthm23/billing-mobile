import { SafeAreaView } from '@/components/base/SafeAreaView';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';

/** «Дашборд» — owner reports, opened from Profile. */
export default function DashboardRoute() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <DashboardScreen />
    </SafeAreaView>
  );
}
