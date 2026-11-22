import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalPayScreen } from '@/screens/rental/RentalPayScreen';
import { useLocalSearchParams } from 'expo-router';

/** Issue of a booking: items check, collateral, optional extra payment */
export default function RentalIssuePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <RentalPayScreen rentalId={id} mode="issue" />
    </SafeAreaView>
  );
}
