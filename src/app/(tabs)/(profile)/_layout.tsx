import { Stack } from 'expo-router';


export default function TabLayout() {


  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" options={{ headerShown: true,  title: 'Profile create', presentation: 'formSheet', sheetCornerRadius: 16 }} />
      <Stack.Screen name="settings" options={{ headerShown: false, title: 'Profile settings' }} />
    </Stack>
    );
}
