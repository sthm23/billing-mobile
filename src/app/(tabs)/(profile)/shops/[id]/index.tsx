import { AdminShopScreen } from '@/screens/admin/shops/AdminShopScreen';
import { useLocalSearchParams } from 'expo-router';

/** Store card (ADMIN). Reached from Profile → «Магазины» → a store. */
export default function AdminShopRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <AdminShopScreen id={id} />;
}
