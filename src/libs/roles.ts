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
 * Owner or manager: may add a manual debt (existed before STHM).
 * UX only — the backend checks it (`POST /debt`).
 */
export const canCreateDebt = canLowerPrice;

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
 * The store has the order assistant («Голос» in the cart) — switched on by a
 * platform admin (`Store.orderAssistantEnabled`). UX only: the backend
 * answers 403 `ORDER_ASSISTANT_DISABLED` otherwise.
 */
export function hasOrderAssistant(user: CurrentUserType | null | undefined): boolean {
  return user?.staff?.store?.orderAssistantEnabled === true;
}

/**
 * Store owner or platform ADMIN: may add a product subcategory («Добавить «…»»).
 * UX only — the backend checks it (`POST /category/subcategory`).
 */
export function canAddCategory(user: CurrentUserType | null | undefined): boolean {
  if (!user) return false;
  return user.role === UserRole.ADMIN || user.role === UserRole.OWNER || user.staff?.role === StaffRole.OWNER;
}

/**
 * Store owner or platform ADMIN: may create a product (step 1 «Карточка»).
 * A manager edits products and adds variants. UX only — the backend checks it (`POST /product`).
 */
export const canCreateProduct = canAddCategory;

/**
 * Store owner or manager: may return goods of a sold order, pay out a refund
 * and give a defect compensation. UX only — the backend checks it (a manager
 * only for orders of their own warehouses).
 */
export function canProcessReturns(user: CurrentUserType | null | undefined): boolean {
  if (!user) return false;
  return user.role === UserRole.OWNER || user.staff?.role === StaffRole.OWNER || user.staff?.role === StaffRole.MANAGER;
}

/** Store owner (or platform admin): every cashbox of the store. */
function isStoreOwner(user: CurrentUserType | null | undefined): boolean {
  return user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER || user?.staff?.role === StaffRole.OWNER;
}

/**
 * Owner, manager or cashier: may open an own cashbox. A seller works in an
 * open cashbox of their warehouse. UX only — the backend checks it (`POST /cashbox`).
 */
export function canOpenCashbox(user: CurrentUserType | null | undefined): boolean {
  return isStoreOwner(user) || user?.staff?.role === StaffRole.MANAGER || user?.staff?.role === StaffRole.CASHIER;
}

/**
 * May take money out of (expense) / close the cashbox of `sellerId`: own
 * cashbox — always; someone else's — expense for the owner and managers, close
 * for the owner only. A seller only adds income. UX only — the backend checks it.
 */
export function cashboxRights(user: CurrentUserType | null | undefined, sellerId: string | undefined) {
  const mine = !!sellerId && sellerId === user?.staff?.id;
  return {
    expense: mine || isStoreOwner(user) || user?.staff?.role === StaffRole.MANAGER,
    close: mine || isStoreOwner(user),
  };
}
