import { ComingSoonScreen } from '@/components/common';
import { CalendarPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

/** New booking — built in phase 6.3 */
export default function CreateRentalPage() {
  const { t } = useTranslation();

  return <ComingSoonScreen title={t('rental.newBooking')} icon={CalendarPlus} />;
}
