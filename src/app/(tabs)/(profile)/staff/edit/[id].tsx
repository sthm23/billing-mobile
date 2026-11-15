import { SafeAreaView } from '@/components/base/SafeAreaView';
import { StaffEditScreen } from '@/screens/profile/staff/StaffEditScreen';
import { useLocalSearchParams } from 'expo-router';

/** Edit an employee: name, phone, login, role, warehouses (OWNER only). */
export default function StaffEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <StaffEditScreen id={id} />
    </SafeAreaView>
  );
}
