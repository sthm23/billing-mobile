import { Box, Text } from '@/components/base';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanProductScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-background">
        <Box>
            <Text className="text-2xl font-bold">Scan page</Text>
        </Box>
    </SafeAreaView>
  );
}
