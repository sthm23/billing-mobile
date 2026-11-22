import { addLocalDays, fromLocalDate, toLocalDate } from '@/screens/rental/rental-format';

/** Quick repay-by choices: in 1 week, 2 weeks, 1 month, or no term */
export type DueQuick = '1w' | '2w' | '1m' | 'none';

export const DUE_QUICK: DueQuick[] = ['1w', '2w', '1m', 'none'];

/** Repay-by day (`YYYY-MM-DD`) of a quick chip, counted from `today` */
export function quickDue(quick: DueQuick, today: string): string | null {
  if (quick === 'none') return null;
  if (quick === '1w') return addLocalDays(today, 7);
  if (quick === '2w') return addLocalDays(today, 14);
  const d = fromLocalDate(today);
  return toLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()));
}

/** End of the local day — «вернуть до 28.11» includes the 28th */
export function endOfLocalDay(day: string): string {
  const d = fromLocalDate(day);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
