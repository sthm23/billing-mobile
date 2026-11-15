import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalCalendarScreen } from '@/screens/rental/RentalCalendarScreen';

/** Rentals calendar: issues and returns per day */
export default function RentalCalendarPage() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <RentalCalendarScreen />
    </SafeAreaView>
  );
}
