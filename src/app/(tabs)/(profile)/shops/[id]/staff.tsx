import { AdminShopStaffScreen } from '@/screens/admin/shops/AdminShopStaffScreen';
import { useLocalSearchParams } from 'expo-router';

/** All employees of a store, read-only (ADMIN). */
export default function AdminShopStaffRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <AdminShopStaffScreen id={id} />;
}
