import type { ProductVariant } from '@/models/product.model';

/** The variant can be booked: rental on and a day price set (R3; the backend checks it again) */
export function isRentable(variant: Pick<ProductVariant, 'canRent' | 'rentPricePerDay'>): boolean {
  return !!variant.canRent && Number(variant.rentPricePerDay ?? 0) > 0;
}
