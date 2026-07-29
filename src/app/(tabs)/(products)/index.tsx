import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function ProductsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleProductPress = (product: any) => {
    console.log('Product pressed:', product);
    // TODO: Navigate to product detail
    router.push(product.id);
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <Box className="flex-row items-center justify-between px-4 py-2">
        <Text size="2xl" bold className="text-lg font-bold text-center">Продукты</Text>
        <Button onPress={() => console.log('Create button pressed')}>
          <ButtonText>{t('order.create')}</ButtonText>
        </Button>
      </Box>
    </SafeAreaView>
  );
}
