import { Stack } from 'expo-router';


export default function TabLayout() {


  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ headerShown: true,  title: 'Profile create' }} />
      <Stack.Screen name="settings" options={{ headerShown: false, title: 'Profile settings' }} />
    </Stack>
    );
}
