import { Stack } from 'expo-router';

// The tab's list is always the root, even when a nested screen is opened
// directly (Scan button, after payment, deep link) — back returns to it.
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="debtors/index" />
      <Stack.Screen name="debtors/[customerId]" />
      <Stack.Screen name="debtors/pay" />
    </Stack>
  );
}
