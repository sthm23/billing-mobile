import { ShopSuspendedScreen } from '@/screens/admin/ShopSuspendedScreen';

/** Shown instead of the tabs while the user's store is suspended (root layout guard). */
export default function SuspendedRoute() {
  return <ShopSuspendedScreen />;
}
