import { SafeAreaView } from '@/components/base/SafeAreaView';
import { DebtPayScreen } from '@/screens/debt/DebtPayScreen';
import type { DebtKind } from '@/services/debt';
import { useLocalSearchParams } from 'expo-router';

/** «Погашение долга»: `?customerId&kind=ORDER|MANUAL&id`. */
export default function DebtPayRoute() {
  const { customerId, kind, id } = useLocalSearchParams<{ customerId: string; kind: DebtKind; id: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <DebtPayScreen customerId={customerId} kind={kind === 'MANUAL' ? 'MANUAL' : 'ORDER'} id={id} />
    </SafeAreaView>
  );
}
