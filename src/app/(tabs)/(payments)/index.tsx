
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function PaymentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const paymentsList = []

  const handleCreatePayment = () => {
    router.push({
      pathname: '/(tabs)/(payments)/[id]',
      params: { id: '123' },
    });
  }
  return (
    <SafeAreaView className="flex-1 justify-center bg-background">
      <Box className="h-full px-4 py-2">
        <View className="w-full flex-row items-center justify-between px-4 py-2">
          <Text className="text-lg font-bold">{t('payment.payments')}</Text>

          <Button onPress={handleCreatePayment}>
            <ButtonText>{t('order.create')}</ButtonText>
          </Button>
        </View>

        <View className='flex-1 justify-center'>
          <Text size="2xl" bold>Payment page</Text>
        </View>

      </Box>

    </SafeAreaView>
  );
}
