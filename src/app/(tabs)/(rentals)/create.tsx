import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalFormScreen } from '@/screens/rental/form/RentalFormScreen';

/** New booking */
export default function CreateRentalPage() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <RentalFormScreen />
    </SafeAreaView>
  );
}
