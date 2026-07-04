import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ProductsScreen() {
  const router = useRouter();

  const handleProductPress = (product: any) => {
    console.log('Product pressed:', product);
    // TODO: Navigate to product detail
    router.push(product.id);
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
      <ThemedView type="surface" className="flex-row items-center justify-between px-4 py-2">
        <ThemedText type="title" className="text-lg font-bold text-center">Продукты</ThemedText>
        <Button onPress={() => console.log('Create button pressed')}>Create</Button>
      </ThemedView>
    </SafeAreaView>
  );
}
