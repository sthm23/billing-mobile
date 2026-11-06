import { Stack } from 'expo-router';

// The tab's list is always the root, even when a nested screen is opened
// directly (center button «Новая бронь», deep link) — back returns to it.
export const unstable_settings = {
  initialRouteName: 'index',
};

/** Rentals tab (store with rental enabled): list, new booking, booking card. */
export default function RentalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen name="pay/[id]" />
      <Stack.Screen name="soon" />
    </Stack>
  );
}
