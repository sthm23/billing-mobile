import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
// import { useTranslation } from 'react-i18next';
import {
  SafeAreaView
} from 'react-native-safe-area-context';



export default function ProfileScreen() {
  // const {t} = useTranslation();


  return (
        <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
            <ThemedView type='surface'>
                <ThemedText type='title'>Profile page</ThemedText>
            </ThemedView>
        </SafeAreaView>
  );
}
