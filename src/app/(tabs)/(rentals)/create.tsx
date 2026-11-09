import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalFormScreen } from '@/screens/rental/form/RentalFormScreen';
import { parseRangeParams } from '@/screens/rental/rental-format';
import { useLocalSearchParams } from 'expo-router';

/**
 * New booking; `?productId&variantId` — started from an item card with that
 * item, `&startDate&endDate` (YYYY-MM-DD) — with the dates picked there.
 */
export default function CreateRentalPage() {
  const { productId, variantId, startDate, endDate } = useLocalSearchParams<{
    productId?: string;
    variantId?: string;
    startDate?: string;
    endDate?: string;
  }>();
  const range = parseRangeParams(startDate, endDate);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <RentalFormScreen preset={productId && variantId ? { productId, variantId, range } : undefined} />
    </SafeAreaView>
  );
}
