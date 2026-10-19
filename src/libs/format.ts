/** No-break space: groups digits without letting the amount wrap. */
const GROUP_SEPARATOR = ' ';
/** Typographic minus, as in the STHM design (−6 443 681). */
const MINUS = '−';

export interface FormatMoneyOptions {
  /** Prefix positive values with "+" (income, repayments). */
  signed?: boolean;
}

/**
 * Formats an amount for display: whole units, digits grouped by thousands,
 * e.g. `18056319` → "18 056 319", `-6443681` → "−6 443 681".
 *
 * Display only — never use the result for calculations. Amounts come from
 * the backend; Decimal strings ("120000.00") are accepted.
 */
export function formatMoney(value: string | number | null | undefined, options: FormatMoneyOptions = {}): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);

  if (!Number.isFinite(num)) {
    return '0';
  }

  const rounded = Math.round(num);
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);

  if (rounded < 0) {
    return MINUS + digits;
  }

  return options.signed && rounded > 0 ? `+${digits}` : digits;
}
