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
      <Stack.Screen name="staff/index" />
      <Stack.Screen name="staff/create" />
      <Stack.Screen name="staff/[id]" />
      <Stack.Screen name="staff/edit/[id]" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="store-settings" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="debtors/index" />
      <Stack.Screen name="debtors/new" />
      <Stack.Screen name="debtors/[customerId]" />
      <Stack.Screen name="debtors/pay" />
      <Stack.Screen name="telegram-shop" />
      <Stack.Screen name="online-orders/index" />
      <Stack.Screen name="online-orders/[id]" />
      <Stack.Screen name="shops/index" />
      <Stack.Screen name="shops/new" />
      <Stack.Screen name="shops/[id]/index" />
      <Stack.Screen name="shops/[id]/staff" />
      <Stack.Screen name="shops/[id]/brands" />
      <Stack.Screen name="shops/[id]/attributes" />
    </Stack>
  );
}
