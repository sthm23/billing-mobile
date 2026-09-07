import { useTheme } from '@/hooks/use-theme';
import CashboxDetailsPage from '@/screens/payment/CashboxDetailsPage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CashboxDetailScreen() {
  const colors = useTheme();
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      <CashboxDetailsPage />
    </SafeAreaView>
  );
}