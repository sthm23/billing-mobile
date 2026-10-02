import { Button, Text } from '@/components/base';
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
      title: product?.name ?? t('product.details'),
      headerRight: () => (
        <Button variant="ghost" size="sm" onPress={() => console.log('Edit')}>
          {t('common.edit')}
        </Button>
      ),
    });
  }, [navigation, product?.name, t]);

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
        <Text variant="muted" className="text-center">
          {isError ? t('product.errorLoading') : t('product.notFound')}
        </Text>
      </View>
    );
  }

  return <ProductDetailScreen product={product} />;
}
