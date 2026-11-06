import type { StatusTone } from '@/components/base';
import { RentalStatus, type Rental, type RentalDetail, type RentalOrderItem, type RentalView } from '@/services/rental';
import type { TFunction } from 'i18next';

/**
 * Display helpers of the rental screens. Statuses, overdue flags, totals and
 * dues come from the backend — nothing here decides a business rule.
 */

/** Rentals out with the customer (issued, part returned) */
export const OUT_STATUSES: RentalStatus[] = [RentalStatus.ISSUED, RentalStatus.PARTIALLY_RETURNED];

export const RENTAL_STATUS_TONE: Record<RentalStatus, StatusTone> = {
  [RentalStatus.BOOKED]: 'info',
  [RentalStatus.ISSUED]: 'warn',
  [RentalStatus.PARTIALLY_RETURNED]: 'warn',
  [RentalStatus.RETURNED]: 'ok',
  [RentalStatus.CANCELLED]: 'neutral',
};

const LOCALES: Record<string, string> = { ru: 'ru-RU', uz: 'uz-UZ', en: 'en-GB' };

function locale(language: string): string {
  return LOCALES[language] ?? LOCALES.ru;
}

/** «14 мая» */
export function formatDay(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(locale(language), { day: 'numeric', month: 'long' });
}

/** «14 мая, 10:20» */
export function formatDayTime(iso: string, language: string): string {
  return new Date(iso).toLocaleString(locale(language), {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** YYYY-MM-DD of a device calendar day */
export function toLocalDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Local calendar day, e.g. «2026-05-14» — to group rows by day */
export function dayKey(iso: string): string {
  return toLocalDate(new Date(iso));
}

/** Device Date (midnight) of a YYYY-MM-DD string */
export function fromLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** YYYY-MM-DD shifted by whole days */
export function addLocalDays(value: string, days: number): string {
  const d = fromLocalDate(value);
  return toLocalDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

/** Salon time zone Asia/Tashkent: UTC+5 all year (no daylight saving) */
const SALON_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;

/**
 * Salon local date (YYYY-MM-DD) of a booking boundary from the backend (12:00
 * there). By the fixed offset: Hermes may lack time zone data for Intl.
 */
export function salonDate(iso: string): string {
  return new Date(Date.parse(iso) + SALON_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

/** Days a booking is priced for: calendar days between the dates. Preview only — the backend prices it */
export function bookingDays(startDate: string, endDate: string): number {
  const [ys, ms, ds] = startDate.split('-').map(Number);
  const [ye, me, de] = endDate.split('-').map(Number);
  return Math.max(1, Math.round((Date.UTC(ye, me - 1, de) - Date.UTC(ys, ms - 1, ds)) / 86_400_000));
}

/** «14 мая, чт» of a YYYY-MM-DD */
export function formatLocalDate(value: string, language: string): string {
  return fromLocalDate(value).toLocaleDateString(locale(language), { day: 'numeric', month: 'long', weekday: 'short' });
}

export function initials(name: string | null | undefined): string {
  return (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Status badges of a rental: its status, plus «Просрочено» from the backend flag */
export function rentalBadges(rental: Pick<Rental, 'status' | 'overdue'>, t: TFunction): { label: string; tone: StatusTone }[] {
  const badges = [{ label: t(`rental.status.${rental.status}`), tone: RENTAL_STATUS_TONE[rental.status] }];
  if (rental.overdue) badges.push({ label: t('rental.overdue'), tone: 'err' });
  return badges;
}

/**
 * The day a row is about: a booking — its issue day, a rental out — its return
 * day, a closed one — its start (history).
 */
export function rowDay(rental: Pick<Rental, 'status' | 'startDate' | 'endDate'>): string {
  return OUT_STATUSES.includes(rental.status) ? rental.endDate : rental.startDate;
}

/** List order per quick filter: the work queue by its own date, «all» newest first */
export function viewSort(view: RentalView): { sortBy: 'startDate' | 'endDate'; sort: 'asc' | 'desc' } {
  switch (view) {
    case 'issueToday':
    case 'booked':
      return { sortBy: 'startDate', sort: 'asc' };
    case 'returnToday':
    case 'overdue':
    case 'out':
      return { sortBy: 'endDate', sort: 'asc' };
    case 'all':
      return { sortBy: 'startDate', sort: 'desc' };
  }
}

/** Units returned / booked, over all lines */
export function returnedUnits(rental: RentalDetail): { returned: number; total: number } {
  return rental.order.items.reduce(
    (acc, item) => ({ returned: acc.returned + item.returnedQuantity, total: acc.total + item.quantity }),
    { returned: 0, total: 0 },
  );
}

/** Attribute values of a rented line («White · XL»); the SKU when it has none */
export function itemAttributes(item: RentalOrderItem): string {
  const attrs = item.variant.attributes
    .map((a) => a.value.valueString ?? (a.value.valueNumber != null ? String(a.value.valueNumber) : null))
    .filter(Boolean)
    .join(' · ');
  return attrs || item.variant.sku;
}

/** «Пн … Вс» in the app language, Monday first */
export function weekDayLabels(language: string): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale(language), { weekday: 'short' }),
  );
}

/** First day of the month of a YYYY-MM-DD */
export function monthStart(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

/** Last day of the month of a YYYY-MM-DD */
export function monthEnd(value: string): string {
  const d = fromLocalDate(monthStart(value));
  return toLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/** Monday of the week of a YYYY-MM-DD */
export function weekStart(value: string): string {
  return addLocalDays(value, -((fromLocalDate(value).getDay() + 6) % 7));
}

/** Monday-first grid of the month: YYYY-MM-DD days padded with nulls to full weeks */
export function monthGrid(value: string): (string | null)[] {
  const first = monthStart(value);
  const lead = (fromLocalDate(first).getDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = first; day <= monthEnd(value); day = addLocalDays(day, 1)) cells.push(day);
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** «Май 2026» */
export function formatMonth(value: string, language: string): string {
  const text = fromLocalDate(value).toLocaleDateString(locale(language), { month: 'long', year: 'numeric' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** «14 мая, четверг» of a YYYY-MM-DD */
export function formatLongDay(value: string, language: string): string {
  return fromLocalDate(value).toLocaleDateString(locale(language), { day: 'numeric', month: 'long', weekday: 'long' });
}
