/**
 * Step 2 «Варианты» helpers: combinations of the chosen attribute values and
 * the fill rules of a variant row (decision 9 in billing/docs/product-create/PLAN.md).
 * UX only — the backend validates the same rules.
 */

/** A chosen value of one attribute */
export interface ComboValue {
  attributeId: string;
  valueId: string;
  label: string;
}

/** One variant to create: a set of values (one per attribute); `key` is stable */
export interface Combo {
  key: string;
  values: ComboValue[];
}

/** Editable fields of a variant row (raw digits) */
export interface VariantRow {
  qty: string;
  cost: string;
  price: string;
  barCode: string;
}

export const EMPTY_ROW: VariantRow = { qty: '', cost: '', price: '', barCode: '' };

/** Same rule as the backend `BARCODE_PATTERN` */
export const BARCODE_PATTERN = /^\d{8,14}$/;

/** Key of a value set, independent of the order */
export function comboKey(valueIds: string[]): string {
  return [...valueIds].sort().join('|');
}

/**
 * All combinations of the chosen values, attributes in the given order.
 * No attributes → one combination without values. An attribute without a
 * chosen value → no combinations (every attribute needs one).
 */
export function buildCombos(attributeIds: string[], chosen: Record<string, ComboValue[]>): Combo[] {
  let acc: ComboValue[][] = [[]];
  for (const id of attributeIds) {
    const values = chosen[id] ?? [];
    if (!values.length) return [];
    acc = acc.flatMap((prefix) => values.map((v) => [...prefix, v]));
  }

  return acc.map((values) => ({ key: comboKey(values.map((v) => v.valueId)), values }));
}

export type RowState = 'empty' | 'partial' | 'complete';

export interface RowCheck {
  state: RowState;
  missingCost: boolean;
  missingPrice: boolean;
  badBarcode: boolean;
}

/**
 * - nothing filled → `empty` (the variant is not in stock and is not sent);
 * - cost + sale price (> 0) filled, qty empty or 0 → `complete` (future goods);
 * - anything else filled without both prices, or a bad barcode → `partial` (blocks saving).
 */
export function checkRow(row: VariantRow): RowCheck {
  const any = !!(row.qty || row.cost || row.price || row.barCode);
  if (!any) return { state: 'empty', missingCost: false, missingPrice: false, badBarcode: false };
  const missingCost = row.cost === '';
  const missingPrice = row.price === '' || Number(row.price) <= 0;
  const badBarcode = row.barCode !== '' && !BARCODE_PATTERN.test(row.barCode);
  const ok = !missingCost && !missingPrice && !badBarcode;

  return { state: ok ? 'complete' : 'partial', missingCost, missingPrice, badBarcode };
}

/** Markup in % for the badge — display only; null without a cost */
export function markupPercent(row: VariantRow): number | null {
  const cost = Number(row.cost);
  const price = Number(row.price);
  if (!row.cost || !row.price || cost <= 0) return null;

  return Math.round(((price - cost) / cost) * 100);
}
