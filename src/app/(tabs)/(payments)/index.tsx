
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function PaymentsScreen() {
  const  {t} = useTranslation();
  const router = useRouter();

  const paymentsList = []

  const handleCreatePayment = () => {
    router.push({
    pathname: '/(tabs)/(payments)/[id]',
    params: { id: '123' },
  });
  }
  return (
    <SafeAreaView className="flex-1 justify-center bg-surface dark:bg-surface-dark">
      <ThemedView type="surface" className="h-full px-4 py-2">
      <View className="w-full flex-row items-center justify-between px-4 py-2">
        <ThemedText className="text-lg font-bold">{t('payment.payments')}</ThemedText>

        <Button onPress={handleCreatePayment}>
          {t('order.create')}
        </Button>
      </View>

      <View className='flex-1 justify-center'>
        <ThemedText type='title'>Payment page</ThemedText>
      </View>

    </ThemedView>

    </SafeAreaView>
  );
}
