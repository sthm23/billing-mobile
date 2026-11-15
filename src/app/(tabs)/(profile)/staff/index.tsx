import { SafeAreaView } from '@/components/base/SafeAreaView';
import { StaffListScreen } from '@/screens/profile/staff/StaffListScreen';

/** Employees of the store (OWNER only). Reached from Profile → Сотрудники. */
export default function StaffListRoute() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <StaffListScreen />
    </SafeAreaView>
  );
}
