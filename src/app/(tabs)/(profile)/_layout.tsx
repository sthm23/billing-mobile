import { Stack } from 'expo-router';


export default function TabLayout() {


  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Profile' }} />
      <Stack.Screen name="create" options={{ headerShown: true,  title: 'Profile create',  }}>
        <Stack.Screen.BackButton>Back</Stack.Screen.BackButton>
      </Stack.Screen>
    </Stack>
    );
}
