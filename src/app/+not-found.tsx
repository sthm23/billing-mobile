import { Button, Text } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { House, SearchX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * 404 — any route that doesn't exist.
 */
export default function NotFoundScreen() {
  const { t } = useTranslation();
  const colors = useTheme();

  const goHome = () => router.replace('/');

  return (
    <SafeAreaView className="flex-1 bg-bg px-4 pt-6 pb-6 gap-3">
      <View className="flex-1 items-center justify-center gap-5">
        <View className="w-[220px] h-[220px] rounded-full bg-card items-center justify-center">
          <Text className="font-onest-bold text-[76px] tracking-[-3px] text-ink">
            4<Text className="font-onest-bold text-[76px] text-accent">0</Text>4
          </Text>
          <View className="absolute right-[18px] bottom-[26px] w-14 h-14 rounded-full bg-hero items-center justify-center">
            <SearchX size={24} color={colors.heroInk} strokeWidth={2} />
          </View>
        </View>
        <View className="items-center gap-2 max-w-[300px]">
          <Text className="type-title text-ink text-center" accessibilityRole="header">
            {t('notFound.title')}
          </Text>
          <Text className="type-body text-muted text-center">{t('notFound.description')}</Text>
        </View>
      </View>

      <Button variant="accent" size="lg" full icon={House} onPress={goHome}>
        {t('notFound.goHome')}
      </Button>
      {router.canGoBack() ? (
        <Button variant="secondary" size="lg" full onPress={() => router.back()}>
          {t('common.back')}
        </Button>
      ) : null}
    </SafeAreaView>
  );
}
