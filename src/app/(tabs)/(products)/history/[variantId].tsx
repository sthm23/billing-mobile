import { SafeAreaView } from '@/components/base/SafeAreaView';
import { StockHistoryScreen } from '@/screens/product/StockHistoryScreen';
import { useLocalSearchParams } from 'expo-router';

/** Stock movement history of a variant (opened from the product card). */
export default function StockHistoryRoute() {
  const { variantId, title, subtitle, stock } = useLocalSearchParams<{
    variantId: string;
    title?: string;
    subtitle?: string;
    stock?: string;
  }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <StockHistoryScreen
        variantId={variantId}
        title={title ?? ''}
        subtitle={subtitle ?? ''}
        stock={stock !== undefined && stock !== '' ? Number(stock) : undefined}
      />
    </SafeAreaView>
  );
}
