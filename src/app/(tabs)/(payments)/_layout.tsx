import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ 
        headerShown: true, 
        title: t('order.payment'),
        }}
        >
          <Stack.Screen.BackButton>Back</Stack.Screen.BackButton>
      </Stack.Screen>
    </Stack>
    );
}
