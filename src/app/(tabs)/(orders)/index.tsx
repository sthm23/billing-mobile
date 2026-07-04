import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import {
  SafeAreaView
} from 'react-native-safe-area-context';


export default function OrdersScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
      <ThemedView type='surface' className="flex-row items-center justify-between px-4 py-2">
        <ThemedText type='title'>Заказы</ThemedText>
          <Button>Создать</Button>
      </ThemedView>
    </SafeAreaView>
  );
}

