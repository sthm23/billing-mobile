import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalFormScreen } from '@/screens/rental/form/RentalFormScreen';
import { useLocalSearchParams } from 'expo-router';

/** Edit a booked rental */
export default function EditRentalPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <RentalFormScreen rentalId={id} />
    </SafeAreaView>
  );
}
