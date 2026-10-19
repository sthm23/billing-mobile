import { BottomNav } from '@/components/navigation/BottomNav';
import { Tabs } from 'expo-router';

/**
 * Main tabs with the floating STHM BottomNav:
 * Products · Orders · [Scan → new order] · Cashbox · Profile.
 */
const TabsLayout = () => {
  return (
    <Tabs tabBar={(props) => <BottomNav {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="(products)" />
      <Tabs.Screen name="(orders)" />
      <Tabs.Screen name="(cashbox)" />
      <Tabs.Screen name="(profile)" />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
};

export default TabsLayout;
