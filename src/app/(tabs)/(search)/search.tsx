import { Box, Text } from '@/components/base';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function SearchProductScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-background">
        <Box>
            <Text className="text-2xl font-bold">{t('search.title')}</Text>
        </Box>
    </SafeAreaView>
  );
}