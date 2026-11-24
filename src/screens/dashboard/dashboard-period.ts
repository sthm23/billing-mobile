import { addLocalDays, fromLocalDate, monthEnd, monthStart, salonDate, toLocalDate } from '@/screens/rental/rental-format';
import type { DashboardParams } from '@/services/dashboard';
import type { TFunction } from 'i18next';

export type DashboardPeriodKey = 'today' | 'yesterday' | 'week' | 'month' | 'prevMonth' | 'custom';
export const DASHBOARD_PERIODS: DashboardPeriodKey[] = ['today', 'yesterday', 'week', 'month', 'prevMonth', 'custom'];

/** Longest period (the backend rejects more); the custom date pickers keep within it. */
export const MAX_PERIOD_DAYS = 31;

export interface DashboardPeriod {
  key: DashboardPeriodKey;
  /** Custom period, YYYY-MM-DD local days (inclusive) */
  from: string | null;
  to: string | null;
}

export const DEFAULT_PERIOD: DashboardPeriod = { key: 'month', from: null, to: null };

/** First and last local day (inclusive); null for a custom period without a start yet. */
export function periodDays(
  period: DashboardPeriod,
  today: string = toLocalDate(new Date()),
): { first: string; last: string } | null {
  switch (period.key) {
    case 'today':
      return { first: today, last: today };
    case 'yesterday': {
      const day = addLocalDays(today, -1);
      return { first: day, last: day };
    }
    case 'week':
      return { first: addLocalDays(today, -6), last: today };
    case 'month':
      return { first: monthStart(today), last: monthEnd(today) };
    case 'prevMonth': {
      const prev = addLocalDays(monthStart(today), -1);
      return { first: monthStart(prev), last: monthEnd(prev) };
    }
    case 'custom':
      if (!period.from) return null;
      return { first: period.from, last: period.to ?? period.from };
  }
}

/** Request params: local day bounds `[first 00:00, day after last 00:00)` as ISO. */
export function periodParams(days: { first: string; last: string }, warehouseId: string | null): DashboardParams {
  return {
    from: fromLocalDate(days.first).toISOString(),
    to: fromLocalDate(addLocalDays(days.last, 1)).toISOString(),
    ...(warehouseId ? { warehouseId } : {}),
  };
}

/** Latest day the custom «По» may take: 31 days from «С», never after today. */
export function maxCustomTo(from: string | null, today: string): string {
  if (!from) return today;
  const limit = addLocalDays(from, MAX_PERIOD_DAYS - 1);
  return limit < today ? limit : today;
}

/** Earliest day the custom «С» may take: 31 days before «По». */
export function minCustomFrom(to: string | null): string | undefined {
  return to ? addLocalDays(to, -(MAX_PERIOD_DAYS - 1)) : undefined;
}

/** Store-local hour (0–23) of a chart point; Asia/Tashkent is UTC+5 all year. */
export function salonHour(iso: string): number {
  return (new Date(iso).getUTCHours() + 5) % 24;
}

/** Store-local day of a chart point, YYYY-MM-DD. */
export function salonDay(iso: string): string {
  return salonDate(iso);
}

/** «09:00–10:00» */
export function hourRange(hour: number): string {
  const pad = (h: number) => `${String(h % 24).padStart(2, '0')}:00`;
  return `${pad(hour)}–${pad(hour + 1)}`;
}

/**
 * Short amount for tight tiles: «412,4 млн», «24 тыс». Display only, from
 * backend figures (same wording as the staff card).
 */
export function shortAmount(value: number, t: TFunction): string {
  const units: [number, string][] = [
    [1e9, 'staff.card.billions'],
    [1e6, 'staff.card.millions'],
    [1e3, 'staff.card.thousands'],
  ];
  const sign = value < 0 ? '−' : '';
  const abs = Math.abs(value);
  for (const [size, key] of units) {
    if (abs >= size) {
      const short = Math.round((abs / size) * 10) / 10;
      return sign + t(key, { value: String(short).replace('.', ',') });
    }
  }
  return sign + String(Math.round(abs));
}

/** Width of a share bar: value against the largest value of the card, «0%»–«100%». */
export function barWidth(value: number, max: number): `${number}%` {
  if (max <= 0 || value <= 0) return '0%';
  return `${Math.max(2, Math.round((value / max) * 100))}%`;
}
