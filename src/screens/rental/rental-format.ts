import type { StatusTone } from '@/components/base';
import { RentalStatus, type Rental, type RentalDetail, type RentalView } from '@/services/rental';
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

/** Local calendar day, e.g. «2026-05-14» — to group rows by day */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
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
