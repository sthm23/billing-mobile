import { IconButton, Text } from '@/components/base';
import type { ButtonIconComponent } from '@/components/base';
import { router } from 'expo-router';
import { ChevronLeft, Hourglass } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from '@/components/base/SafeAreaView';
import { EmptyState } from './EmptyState';

interface ComingSoonScreenProps {
  /**
   * Screen title shown in the header
   */
  title: string;
  /**
   * Hint under «Скоро будет доступно»
   */
  description?: string;
  icon?: ButtonIconComponent;
}

/**
 * ComingSoonScreen — placeholder for routes whose feature isn't built yet.
 */
export function ComingSoonScreen({ title, description, icon = Hourglass }: ComingSoonScreenProps) {
  const { t } = useTranslation();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="flex-row items-center gap-2 px-4 pt-2 pb-3">
        {router.canGoBack() ? (
          <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        ) : null}
        <Text className="type-heading text-ink flex-1" numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
      </View>
      <EmptyState icon={icon} message={t('common.comingSoon')} description={description} />
    </SafeAreaView>
  );
}
