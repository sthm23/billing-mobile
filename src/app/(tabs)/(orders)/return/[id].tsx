import { SafeAreaView } from '@/components/base/SafeAreaView';
import { ComingSoonScreen } from '@/components/common';
import { Undo2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

/** «Возврат товара» — the return screen comes in stage 3 of the return plan. */
export default function OrderReturnRoute() {
  const { t } = useTranslation();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <ComingSoonScreen title={t('orderView.returnGoods')} icon={Undo2} />
    </SafeAreaView>
  );
}
