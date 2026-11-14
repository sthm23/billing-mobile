import type { CurrentUserType } from '@/models/auth.model';
import { StaffRole, UserRole } from '@/models/user.model';

/**
 * Owner or manager: may lower an order item's price. UX only — the backend
 * checks the same rule (`POST /orders/items`).
 */
export function canLowerPrice(user: CurrentUserType | null | undefined): boolean {
  if (!user) return false;
  return (
    user.role === UserRole.ADMIN ||
    user.role === UserRole.OWNER ||
    user.staff?.role === StaffRole.OWNER ||
    user.staff?.role === StaffRole.MANAGER
  );
}

/**
 * Owner or manager: stock receipt / write-off and archiving products.
 * UX only — the backend enforces it (`POST /warehouse/:id/inventory`, `DELETE /product/:id`).
 */
export const canManageProducts = canLowerPrice;

/**
 * Platform administrator: has no store (no Staff record) and only manages
 * stores — Profile → «Магазины». UX only — the backend checks `AdminGuard`.
 */
export function isAdmin(user: CurrentUserType | null | undefined): boolean {
  return user?.role === UserRole.ADMIN;
}

/** The user's store was suspended by an admin (subscription) — the app is blocked. */
export function isStoreSuspended(user: CurrentUserType | null | undefined): boolean {
  return !isAdmin(user) && user?.staff?.store?.status === 'SUSPENDED';
}

/**
 * Store owner or platform ADMIN: may add a product subcategory («Добавить «…»»).
 * UX only — the backend checks it (`POST /category/subcategory`).
 */
export function canAddCategory(user: CurrentUserType | null | undefined): boolean {
  if (!user) return false;
  return user.role === UserRole.ADMIN || user.role === UserRole.OWNER || user.staff?.role === StaffRole.OWNER;
}
