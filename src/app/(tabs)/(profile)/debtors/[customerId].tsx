import { SafeAreaView } from '@/components/base/SafeAreaView';
import { DebtorScreen } from '@/screens/debt/DebtorScreen';
import { useLocalSearchParams } from 'expo-router';

/** Open debts of one customer. */
export default function DebtorRoute() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <DebtorScreen customerId={customerId} />
    </SafeAreaView>
  );
}
