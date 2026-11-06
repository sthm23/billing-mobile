import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalDetailScreen } from '@/screens/rental/RentalDetailScreen';
import { useLocalSearchParams } from 'expo-router';

/** Booking card */
export default function RentalDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <RentalDetailScreen rentalId={id} />
    </SafeAreaView>
  );
}
