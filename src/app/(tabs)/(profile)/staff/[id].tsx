import { SafeAreaView } from '@/components/base/SafeAreaView';
import { StaffCardScreen } from '@/screens/profile/staff/StaffCardScreen';
import { useLocalSearchParams } from 'expo-router';

/** Employee card (OWNER only). */
export default function StaffCardRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <StaffCardScreen id={id} />
    </SafeAreaView>
  );
}
