import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalReturnScreen } from '@/screens/rental/RentalReturnScreen';
import { useLocalSearchParams } from 'expo-router';

/** Return of rented items: what came back, dry cleaning, penalty, money */
export default function RentalReturnPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <RentalReturnScreen rentalId={id} />
    </SafeAreaView>
  );
}
