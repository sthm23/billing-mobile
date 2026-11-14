import { ComingSoonScreen } from '@/components/common';
import { Layers } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

/** Step 2 «Варианты» — built in stage 3 of billing/docs/product-create/PLAN.md */
export default function ProductVariantsRoute() {
  const { t } = useTranslation();

  return <ComingSoonScreen title={t('productForm.variantsTitle')} icon={Layers} />;
}
