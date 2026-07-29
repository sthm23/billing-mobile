import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from 'react-native-safe-area-context';

const tokens = {
  container: "flex-1 bg-background",
  text: "text-lg font-bold text-foreground",
}

export default function Index() {
  return (
    <Box className={tokens.container}>
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center">
        <Text className={tokens.text}>Edit src/app/index.tsx to edit this screen.</Text>
      </SafeAreaView>
    </Box>
  );
}

