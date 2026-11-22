import type { AttributeNames } from '@/models/product.model';

/**
 * Attribute name in the app language: `nameUz` / `nameEn` when filled, otherwise the Russian
 * `name` (billing/docs/attribute-i18n/PLAN.md). Attribute values are not translated.
 */
export function attributeLabel(attribute: AttributeNames | null | undefined, language: string): string {
  if (!attribute) return '';
  if (language.startsWith('uz') && attribute.nameUz) return attribute.nameUz;
  if (language.startsWith('en') && attribute.nameEn) return attribute.nameEn;
  return attribute.name;
}

/** Units are stored in Russian («м», «кг»); known ones are shown in the app language, others as is. */
const UNIT_I18N: Record<string, { uz: string; en: string }> = {
  м: { uz: 'm', en: 'm' },
  см: { uz: 'sm', en: 'cm' },
  мм: { uz: 'mm', en: 'mm' },
  'м²': { uz: 'm²', en: 'm²' },
  'м³': { uz: 'm³', en: 'm³' },
  кг: { uz: 'kg', en: 'kg' },
  г: { uz: 'g', en: 'g' },
  т: { uz: 't', en: 't' },
  л: { uz: 'l', en: 'l' },
  шт: { uz: 'dona', en: 'pcs' },
};

export function unitLabel(unit: string | null | undefined, language: string): string {
  if (!unit) return '';
  const known = UNIT_I18N[unit.trim().toLowerCase()];
  if (!known) return unit;
  if (language.startsWith('uz')) return known.uz;
  if (language.startsWith('en')) return known.en;
  return unit;
}

/** «Длина (м)» / «Uzunlik (m)» — attribute title with its unit */
export function attributeTitle(
  attribute: AttributeNames & { unit?: string | null },
  language: string,
): string {
  const label = attributeLabel(attribute, language);
  const unit = unitLabel(attribute.unit, language);
  return unit ? `${label} (${unit})` : label;
}

/** An attribute with exactly this name in any language (case-insensitive, spaces collapsed). */
export function attributeHasName(attribute: AttributeNames, name: string): boolean {
  const q = name.trim().replace(/\s+/g, ' ').toLowerCase();
  return [attribute.name, attribute.nameUz, attribute.nameEn].some((n) => n?.toLowerCase() === q);
}
