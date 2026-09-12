import { Product } from '@/models/product.model';

/**
 * Formats price with thousands separator
 * @param price - Price value (string or number)
 * @returns Formatted price string (e.g., "60,000")
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(numPrice);
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
