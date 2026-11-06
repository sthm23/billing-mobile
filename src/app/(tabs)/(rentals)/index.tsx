import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalListScreen } from '@/screens/rental/RentalListScreen';

/** Rentals tab root: the bookings list */
export default function RentalsPage() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <RentalListScreen />
    </SafeAreaView>
  );
}
