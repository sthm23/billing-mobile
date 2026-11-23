import { ListCard, type StatusTone } from '@/components/base';
import { productCategoryLabel } from '@/libs/category';
import { getTotalQuantity } from '@/libs/product-utils';
import { Product } from '@/models/product.model';
import { useTranslation } from 'react-i18next';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  /** «Мало» at or below this total stock (from `GET /product`) */
  lowStockThreshold: number;
  onPress: (productId: string) => void;
}

/**
 * Product row in the list: photo, name, category · brand · warehouse,
 * «от» price and stock badge; a draft (no variants yet) shows «Черновик»,
 * an archived product «В архиве».
 */
export function ProductCard({ product, lowStockThreshold, onPress }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const totalQuantity = getTotalQuantity(product);
  const stockTone: StatusTone = totalQuantity <= lowStockThreshold ? 'err' : 'ok';

  const category = productCategoryLabel(product, i18n.language);
  const meta = [category, product.brand, product.warehouse?.name].filter(Boolean).join(' · ');

  // A draft (card without variants) has no price or stock yet
  const draft = !!product.isDraft;
  const badge: { label: string; tone: StatusTone } = product.isArchived
    ? { label: t('product.archivedBadge'), tone: 'neutral' }
    : draft
      ? { label: t('productVariants.draft'), tone: 'warn' }
      : { label: `${totalQuantity} ${t('product.unit')}`, tone: stockTone };

  return (
    <ListCard
      leading={<ProductImage images={product.images} productName={product.name} size="md" />}
      title={product.name}
      subtitle={meta}
      amount={draft ? undefined : (product.priceRange?.min ?? 0)}
      amountPrefix={draft ? undefined : t('product.from')}
      amountCurrency={draft ? undefined : t('common.currency')}
      badge={badge}
      onPress={() => onPress(product.id)}
      className="pl-2.5"
    />
  );
}
