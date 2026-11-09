import { formatMoney } from '@/libs/format';
import { Attribute, AttributeItem, Product, ProductVariant, StockMovementType } from '@/models/product.model';

/**
 * Formats price with thousands separator
 * @param price - Price value (string or number)
 * @returns Formatted price string (e.g., "60 000")
 */
export function formatPrice(price: string | number): string {
  return formatMoney(price);
}

/**
 * Calculates total quantity across all product variants
 * @param product - Product object with variants
 * @returns Total quantity
 */
export function getTotalQuantity(product: Product): number {
  if (!product.variants || product.variants.length === 0) {
    return 0;
  }

  return product.variants.reduce((sum, variant) => sum + variant.quantity, 0);
}

/**
 * Gets the main image URL from product images array
 * @param images - Array of product images
 * @returns Main image URL or null
 */
export function getMainImageUrl(images?: { url: string; id: string; isMain: boolean }[]): string | null {
  if (!images || images.length === 0) {
    return null;
  }

  // Find main image or return first image
  const mainImage = images.find(img => img.isMain) || images[0];
  return mainImage?.url || null;
}

/** Variant name for lists: attribute values («11×25 · Сосна») or the SKU. */
export function getVariantLabel(variant: Pick<ProductVariant, 'attributes' | 'sku'>): string {
  const attrs = variant.attributes ?? [];
  if (attrs.length === 0) return variant.sku;
  return attrs.map((a) => String(a.value)).join(' · ');
}

/** Unit cost of the latest stock receipt that has a cost (0 when none). */
export function getLatestCostPrice(variant: Pick<ProductVariant, 'stockMovements'>): number {
  const lastIn = (variant.stockMovements ?? [])
    .filter((m) => m.type === StockMovementType.IN && m.unitCost !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return lastIn ? Number(lastIn.unitCost) : 0;
}

/** Attribute name by id, for variant attributes that carry only the id */
export function buildNameById(attributes: Attribute[]): Record<string, string> {
  const map: Record<string, string> = {};
  attributes.forEach((a) => (map[a.id] = a.name));
  return map;
}

function attributeName(attr: AttributeItem, nameById: Record<string, string>): string {
  return nameById[attr.attributeId] ?? attr.attributeName ?? attr.attributeId;
}

/** Values of each attribute across the variants, in first-seen order («Размер» → ['44', '46']) */
export function buildAttributeMap(
  variants: ProductVariant[],
  nameById: Record<string, string>
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  variants.forEach((variant) => {
    (variant.attributes ?? []).forEach((attr) => {
      const name = attributeName(attr, nameById);
      if (!map[name]) map[name] = [];
      const val = String(attr.value);
      if (!map[name].includes(val)) map[name].push(val);
    });
  });
  return map;
}

/** Attribute values of a variant by attribute name */
export function getVariantAttrs(
  variant: ProductVariant | undefined,
  nameById: Record<string, string>
): Record<string, string> {
  const attrs: Record<string, string> = {};
  (variant?.attributes ?? []).forEach((attr) => {
    attrs[attributeName(attr, nameById)] = String(attr.value);
  });
  return attrs;
}

/** The variant whose attributes all match the selection, or null */
export function findVariantByAttrs(
  variants: ProductVariant[],
  selected: Record<string, string>,
  nameById: Record<string, string>
): ProductVariant | null {
  return (
    variants.find((v) =>
      (v.attributes ?? []).every((a) => selected[attributeName(a, nameById)] === String(a.value))
    ) ?? null
  );
}
