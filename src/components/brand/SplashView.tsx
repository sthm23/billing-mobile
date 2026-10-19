import { Text } from '@/components/base';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from './Logo';

/**
 * SplashView — in-app splash shown while the session is being restored
 * (after the native splash, before the first screen).
 */
export function SplashView() {
  const { t } = useTranslation();
  const version = Constants.expoConfig?.version ?? '';

  return (
    <SafeAreaView className="flex-1 bg-bg items-center px-6 pb-12">
      <View className="flex-1 items-center justify-center gap-6">
        <View className="rounded-[28px] overflow-hidden">
          <Logo variant="icon" width={112} />
        </View>
        <Text className="font-onest-medium text-[13px] tracking-[0.5px] text-muted text-center">
          {t('app.tagline')}
        </Text>
      </View>

      <View className="items-center gap-3.5">
        <View className="flex-row gap-2" accessibilityRole="progressbar" accessibilityLabel={t('common.loading')}>
          <View className="w-2 h-2 rounded-full bg-line" />
          <View className="w-2 h-2 rounded-full bg-accent" />
          <View className="w-2 h-2 rounded-full bg-line" />
        </View>
        {version ? (
          <Text className="font-onest text-xs text-muted">{t('app.version', { version })}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
