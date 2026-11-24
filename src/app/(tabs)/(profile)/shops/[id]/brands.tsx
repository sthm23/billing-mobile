import { StoreCatalogScreen } from '@/screens/admin/shops/StoreCatalogScreen';
import { useLocalSearchParams } from 'expo-router';

/** Brands of a store: connect / disconnect (ADMIN). */
export default function AdminShopBrandsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <StoreCatalogScreen id={id} kind="brands" />;
}
