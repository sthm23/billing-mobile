import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { formatPrice, getTotalQuantity } from '@/libs/product-utils';
import { Product } from '@/models/product.model';
import { useTranslation } from 'react-i18next';
import { ProductImage } from './ProductImage';
import { QuantityBadge } from './QuantityBadge';

interface ProductCardProps {
  product: Product;
  onPress: (productId: string) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { t } = useTranslation();
  const totalQuantity = getTotalQuantity(product);

  // Get translated category or fallback to original
  const categoryKey = `category.${product.category}`;
  const category = t(categoryKey, { defaultValue: product.category });

  // Get warehouse name
  const warehouseName = product.warehouse?.name || t('product.warehouse');

  return (
    <Pressable
      className="flex-row bg-card rounded-lg p-4 active:opacity-80"
      onPress={() => onPress(product.id)}
    >
      {/* Product Image */}
      <ProductImage
        images={product.images}
        productName={product.name}
        size="md"
      />

      {/* Product Info (Center) */}
      <VStack className="flex-1 ml-3 justify-between">
        {/* Product Name */}
        <Text className="text-lg font-bold text-foreground">
          {product.name}
        </Text>

        {/* Category */}
        <Text className="text-sm text-typography-500 mt-1">
          {category}
        </Text>

        {/* Description (if available) */}
        {product.description && (
          <Text className="text-sm text-typography-400 mt-1" numberOfLines={1}>
            {product.description}
          </Text>
        )}

        {/* Warehouse Name */}
        <HStack className="mt-2 gap-2 items-center">
          <Text className="text-sm text-typography-400">
            {warehouseName}
          </Text>
        </HStack>
      </VStack>

      {/* Right Section (Quantity & Price) */}
      <VStack className="items-end justify-between ml-2">
        {/* Quantity Badge */}
        <QuantityBadge quantity={totalQuantity} />

        {/* Price */}
        <Text className="text-lg font-bold text-foreground mt-auto">
          {t('product.from')} {formatPrice(product.priceRange.min)} UZS
        </Text>
      </VStack>
    </Pressable>
  );
}
