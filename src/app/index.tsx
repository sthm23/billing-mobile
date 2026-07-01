import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SafeAreaView } from 'react-native-safe-area-context';

const tokens = {
  container: "flex-1 items-center justify-center bg-white",
  text: "text-lg font-bold",
}

export default function Index() {
  return (
    <ThemedView type='primary' className={tokens.container}>
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center">
        <ThemedText className={tokens.text}>Edit src/app/index.tsx to edit this screen.</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}


