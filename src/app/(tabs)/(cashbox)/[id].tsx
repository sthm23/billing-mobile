import CashboxDetailsPage from '@/screens/payment/CashboxDetailsPage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CashboxDetailScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <CashboxDetailsPage />
    </SafeAreaView>
  );
}
