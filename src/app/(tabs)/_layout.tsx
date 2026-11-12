import { BottomNav } from '@/components/navigation/BottomNav';
import { isAdmin } from '@/libs/roles';
import { useAuth } from '@/provider/AuthProvider';
import { Tabs } from 'expo-router';

/**
 * Main tabs with the floating STHM BottomNav:
 * Products · Orders · [Scan → new order] · Cashbox · Profile; in rental mode
 * Orders is replaced by Rentals and the center button starts a booking.
 * A platform admin has no store: only Profile (→ «Магазины»), no BottomNav.
 */
const TabsLayout = () => {
  const { user } = useAuth();
  const admin = isAdmin(user);

  return (
    <Tabs tabBar={(props) => <BottomNav {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Protected guard={!admin}>
        <Tabs.Screen name="(products)" />
        <Tabs.Screen name="(orders)" />
        <Tabs.Screen name="(rentals)" />
        <Tabs.Screen name="(cashbox)" />
      </Tabs.Protected>
      <Tabs.Screen name="(profile)" />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
};

export default TabsLayout;
