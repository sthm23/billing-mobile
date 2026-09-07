import { useTheme } from '@/hooks/use-theme';
import CashboxListPage from '@/screens/payment/CashboxListPage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentsScreen() {
  const colors = useTheme();
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      <CashboxListPage />
    </SafeAreaView>
  );
}
