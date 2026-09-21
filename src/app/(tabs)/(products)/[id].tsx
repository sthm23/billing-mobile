import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import ProductDetailScreen from '@/screens/product/ProductDetailScreen';
import { useProductById } from '@/services/product/product.queries';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

export default function ProductDetailRoute() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: product, isLoading, isError } = useProductById(id);

  useEffect(() => {
    navigation.setOptions({
      title: product?.name ?? t('product.details', 'Детали'),
      headerRight: () => (
        <Button variant="ghost" size="sm" onPress={() => console.log('Edit')}>
          <ButtonText>{t('common.edit', 'Изменить')}</ButtonText>
        </Button>
      ),
    });
  }, [navigation, product?.name]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-typography-500 text-center">
          {isError ? 'Ошибка загрузки продукта' : 'Продукт не найден'}
        </Text>
      </View>
    );
  }

  return <ProductDetailScreen product={product} />;
}
