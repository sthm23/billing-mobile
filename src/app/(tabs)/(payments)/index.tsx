
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function PaymentsScreen() {

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
      <ThemedView type="surface" className="h-full flex-col items-center justify-between px-4 py-2">
      <View className="w-full flex-row items-center justify-between px-4 py-2">
        <ThemedText className="text-lg font-bold">{('order.payments')}</ThemedText>

        <Button >
          {('order.create')}
        </Button>
      </View>

      <View className='flex-1 items-center justify-center'>
        <ThemedText type='title'>Payment page</ThemedText>
      </View>

    </ThemedView>

    </SafeAreaView>
  );
}
