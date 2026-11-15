import type { BaseProduct, CategoryNames } from '@/models/product.model';

/**
 * Category name in the app language: `nameUz` / `nameEn` when filled,
 * otherwise the Russian `name`.
 */
export function categoryLabel(category: CategoryNames | null | undefined, language: string): string {
  if (!category) return '';
  if (language.startsWith('uz') && category.nameUz) return category.nameUz;
  if (language.startsWith('en') && category.nameEn) return category.nameEn;
  return category.name;
}

/** The product's subcategory in the app language (older responses only carry `category`). */
export function productCategoryLabel(
  product: Pick<BaseProduct, 'category' | 'categoryI18n'>,
  language: string,
): string {
  return categoryLabel(product.categoryI18n, language) || product.category || '';
}

/** Case-insensitive search over all names of a category. */
export function categoryMatches(category: CategoryNames, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [category.name, category.nameUz, category.nameEn].some((n) => n?.toLowerCase().includes(q));
}

/** A category with exactly this name in any language (case-insensitive). */
export function categoryHasName(category: CategoryNames, name: string): boolean {
  const q = name.trim().replace(/\s+/g, ' ').toLowerCase();
  return [category.name, category.nameUz, category.nameEn].some((n) => n?.toLowerCase() === q);
}
