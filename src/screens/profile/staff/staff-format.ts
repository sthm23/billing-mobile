import type { StaffListItem } from '@/services/store';
import type { TFunction } from 'i18next';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Uzbek numbers: the form keeps the 9 national digits, the API gets +998… */
export const PHONE_PREFIX = '+998';
export const PHONE_DIGITS = 9;
export const STAFF_LOGIN_PATTERN = /^[A-Za-z0-9._-]+$/;

/** "901234567" → "90 123 45 67" (display only). */
export function formatNationalPhone(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)]
    .filter(Boolean)
    .join(' ');
}

/** «+998905551234» → «+998 90 555 12 34»; other formats as they are. */
export function formatPhone(phone: string): string {
  const match = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return match ? `+998 ${match[1]} ${match[2]} ${match[3]} ${match[4]}` : phone;
}

/** Role label: «Продавец» */
export function roleLabel(role: string, t: TFunction): string {
  return t(`staff.role.${role}`);
}

/** «Склад 1, Склад 2»; the owner works with all warehouses. */
export function warehousesLabel(staff: Pick<StaffListItem, 'isOwner' | 'warehouses'>, t: TFunction): string {
  if (staff.isOwner) return t('staff.allWarehouses');
  if (!staff.warehouses.length) return t('staff.noWarehouse');
  return staff.warehouses.map((w) => w.name).join(', ');
}

/** «18,4 млн» for a narrow tile (display only, the amount comes from the backend). */
export function compactAmount(value: number, t: TFunction): string {
  const units: [number, string][] = [
    [1e9, 'staff.card.billions'],
    [1e6, 'staff.card.millions'],
    [1e3, 'staff.card.thousands'],
  ];
  for (const [size, key] of units) {
    if (Math.abs(value) >= size) {
      const short = Math.round((value / size) * 10) / 10;
      return t(key, { value: String(short).replace('.', ',') });
    }
  }
  return String(Math.round(value));
}

/** Time in the team: «8 мес», under a month — «12 дн». */
export function tenureLabel(createdAt: string, t: TFunction, now: Date = new Date()): string {
  const start = new Date(createdAt);
  const months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth()
    - (now.getDate() < start.getDate() ? 1 : 0);
  if (months >= 1) return t('staff.card.tenureMonths', { count: months });
  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / DAY_MS));
  return t('staff.card.tenureDays', { count: days });
}
