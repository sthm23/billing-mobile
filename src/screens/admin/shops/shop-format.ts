import type { StatusTone } from '@/components/base/StatusBadge';
import { formatDate, formatDayMonth } from '@/libs/date';
import type { AdminStoreListItem, StoreMode } from '@/services/admin-store';
import type { TFunction } from 'i18next';

/** Status badge of a store: Активен / Пробный (истёк) / Приостановлен */
export function shopStatusBadge(store: AdminStoreListItem, t: TFunction): { label: string; tone: StatusTone } {
  if (store.status === 'SUSPENDED') return { label: t('adminShops.status.SUSPENDED'), tone: 'err' };
  if (store.status === 'TRIAL') {
    return store.trialExpired
      ? { label: t('adminShops.status.trialExpired'), tone: 'warn' }
      : { label: t('adminShops.status.TRIAL'), tone: 'info' };
  }

  return { label: t('adminShops.status.ACTIVE'), tone: 'ok' };
}

/** Short term line of a list row: «с 12.03.2026», «пробный до 12.12», «с 05.12 · приостановлен» */
export function shopListTerm(store: AdminStoreListItem, t: TFunction): string {
  if (store.status === 'SUSPENDED' && store.suspendedAt) {
    return t('adminShops.term.suspendedSince', { date: formatDayMonth(store.suspendedAt) });
  }
  if (store.status === 'TRIAL' && store.trialEndsAt) {
    return store.trialExpired
      ? t('adminShops.term.trialEnded', { date: formatDayMonth(store.trialEndsAt) })
      : t('adminShops.term.trialUntil', { date: formatDayMonth(store.trialEndsAt) });
  }
  if (store.paidUntil) {
    return t('adminShops.term.paidUntil', { date: formatDayMonth(store.paidUntil) });
  }

  return t('adminShops.term.since', { date: formatDate(store.createdAt) });
}

/** Store modes enabled, in the order of the design */
export function shopModes(store: Pick<AdminStoreListItem, 'salesEnabled' | 'rentalEnabled'>): StoreMode[] {
  return [...(store.salesEnabled ? (['sale'] as const) : []), ...(store.rentalEnabled ? (['rent'] as const) : [])];
}

/** «Ёғоч» → «Ёғ», «Gulnoz Wedding» → «GW» */
export function shopInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();

  return name.trim().slice(0, 2);
}

/** «Тухтамишев Санжар» → «Тухтамишев С.» */
export function shortName(fullName: string): string {
  const [last, first] = fullName.trim().split(/\s+/);

  return first ? `${last} ${first[0]}.` : last ?? '';
}
