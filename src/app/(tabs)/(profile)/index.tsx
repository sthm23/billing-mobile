
import SelectLanguage from '@/components/SelectLanguage';
import { SelectTheme } from '@/components/SelectTheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/provider/AuthProvider';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const tokens = {

}

export default function ProfileScreen() {
  const { t } = useTranslation();

  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  }

  const goToPage = (page: 'create') => {
    router.push(`/(tabs)/(profile)/${page}`);
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface dark:bg-surface-dark">
      <ThemedView type='surface' className='p-4'>
        <ThemedText type='title'>Profile page</ThemedText>
        <View className='flex-row items-center justify-center gap-4'>
          <SelectTheme />
          <SelectLanguage />
        </View>
        <Card className='flex-col items-center justify-center gap-2 my-4'>
          <Button onPress={() => goToPage('create')}>
            <ButtonText>{t('order.create')}</ButtonText>
          </Button>
          <Button onPress={handleLogout}>
            <ButtonText>{t('sidebar.logout')}</ButtonText>
          </Button>
        </Card>
      </ThemedView>
    </SafeAreaView>
  )
}