import { StoreCatalogScreen } from '@/screens/admin/shops/StoreCatalogScreen';
import { useLocalSearchParams } from 'expo-router';

/** Attributes of a store: connect / disconnect (ADMIN). */
export default function AdminShopAttributesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <StoreCatalogScreen id={id} kind="attributes" />;
}
