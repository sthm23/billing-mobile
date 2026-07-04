import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { SafeAreaView } from 'react-native-safe-area-context'


const index = () => {
  return (
    <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <ThemedView type='surface'>
            <ThemedText type='title'>Home page</ThemedText>
        </ThemedView>
    </SafeAreaView>
  )
}

export default index