import { Text } from '@/components/base';
import { SafeAreaView } from '@/components/base/SafeAreaView';
import { EmptyState } from '@/components/common';
import { NavModeSwitch } from '@/components/navigation/NavModeSwitch';
import { CalendarDays } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** Rentals tab root — the list is built in phase 6.2 */
export default function RentalsPage() {
  const { t } = useTranslation();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="px-4 pt-2 pb-3 gap-3">
        <NavModeSwitch />
        <Text className="type-title text-ink" accessibilityRole="header">{t('rental.title')}</Text>
      </View>
      <EmptyState icon={CalendarDays} message={t('common.comingSoon')} />
    </SafeAreaView>
  );
}
