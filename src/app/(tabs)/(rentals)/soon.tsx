import { ComingSoonScreen } from '@/components/common';
import type { RentalActionKind } from '@/screens/rental/RentalDetailScreen';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

/**
 * Placeholder for rental actions built in later phases (6.6 calendar).
 * Removed with 6.6.
 */
export default function RentalActionSoonPage() {
  const { t } = useTranslation();
  const { kind } = useLocalSearchParams<{ kind?: RentalActionKind }>();

  return <ComingSoonScreen title={t(`rental.action.${kind ?? 'calendar'}`)} />;
}
