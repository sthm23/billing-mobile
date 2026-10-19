import { ListCard, type StatusTone } from '@/components/base';
import { getTotalQuantity } from '@/libs/product-utils';
import { Product } from '@/models/product.model';
import { useTranslation } from 'react-i18next';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  onPress: (productId: string) => void;
}

// Display thresholds for the stock badge (same as before the redesign).
const LOW_STOCK_BELOW = 9;

function getStockTone(quantity: number): StatusTone {
  if (quantity === 0) return 'err';
  if (quantity < LOW_STOCK_BELOW) return 'warn';

  return 'ok';
}

/**
 * Product row in the list: photo, name, category · brand · warehouse,
 * «от» price and stock badge.
 */
export function ProductCard({ product, onPress }: ProductCardProps) {
  const { t } = useTranslation();
  const totalQuantity = getTotalQuantity(product);

  // Get translated category or fallback to original
  const category = t(`category.${product.category}`, { defaultValue: product.category });
  const meta = [category, product.brand, product.warehouse?.name].filter(Boolean).join(' · ');

  return (
    <ListCard
      leading={<ProductImage images={product.images} productName={product.name} size="md" />}
      title={product.name}
      subtitle={meta}
      amount={product.priceRange?.min ?? 0}
      amountPrefix={t('product.from')}
      amountCurrency={t('common.currency')}
      badge={{ label: `${totalQuantity} ${t('product.unit')}`, tone: getStockTone(totalQuantity) }}
      onPress={() => onPress(product.id)}
      className="pl-2.5"
    />
  );
}
