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
