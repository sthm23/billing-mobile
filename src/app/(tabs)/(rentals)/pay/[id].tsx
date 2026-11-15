import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalPayScreen } from '@/screens/rental/RentalPayScreen';
import { useLocalSearchParams } from 'expo-router';

/** Payments and collateral of a rental; `created=1` right after booking */
export default function RentalPayPage() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();

  if (!id) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <RentalPayScreen rentalId={id} created={created === '1'} />
    </SafeAreaView>
  );
}
