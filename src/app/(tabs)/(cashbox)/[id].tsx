import CashboxDetailsPage from '@/screens/payment/CashboxDetailsPage';
import { SafeAreaView } from '@/components/base/SafeAreaView';

export default function CashboxDetailScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <CashboxDetailsPage />
    </SafeAreaView>
  );
}
