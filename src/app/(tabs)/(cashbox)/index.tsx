import CashboxListPage from '@/screens/payment/CashboxListPage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CashboxScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <CashboxListPage />
    </SafeAreaView>
  );
}
