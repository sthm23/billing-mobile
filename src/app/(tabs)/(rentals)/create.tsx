import { SafeAreaView } from '@/components/base/SafeAreaView';
import { RentalFormScreen } from '@/screens/rental/form/RentalFormScreen';
import { useLocalSearchParams } from 'expo-router';

/** New booking; `?productId&variantId` — started from an item card with that item */
export default function CreateRentalPage() {
  const { productId, variantId } = useLocalSearchParams<{ productId?: string; variantId?: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <RentalFormScreen preset={productId && variantId ? { productId, variantId } : undefined} />
    </SafeAreaView>
  );
}
