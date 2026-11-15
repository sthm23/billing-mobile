import { SafeAreaView } from '@/components/base/SafeAreaView';
import { DebtPayScreen } from '@/screens/debt/DebtPayScreen';
import { useLocalSearchParams } from 'expo-router';

/** «Принять оплату долга» from the order screen: `?customerId&id` (order id). Same screen as Debtors → pay. */
export default function OrderDebtPayRoute() {
  const { customerId, id } = useLocalSearchParams<{ customerId: string; id: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <DebtPayScreen customerId={customerId} kind="ORDER" id={id} />
    </SafeAreaView>
  );
}
