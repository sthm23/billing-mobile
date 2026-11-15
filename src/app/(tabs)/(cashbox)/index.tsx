import CashboxListPage from '@/screens/payment/CashboxListPage';
import { SafeAreaView } from '@/components/base/SafeAreaView';

export default function CashboxScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <CashboxListPage />
    </SafeAreaView>
  );
}
