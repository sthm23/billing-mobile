import { Store } from '@/models/store.model';
import { StaffRole } from '@/models/user.model';

/** Roles an owner can give a new employee from the mobile app. */
export const ASSIGNABLE_STAFF_ROLES = [StaffRole.MANAGER, StaffRole.SELLER, StaffRole.CASHIER] as const;

export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];

/**
 * POST /store/staff body. `storeId` must be the current owner's store —
 * the backend rejects any other store.
 */
export interface CreateStaffPayload {
  fullName: string;
  /** Full international number, e.g. +998901234567 */
  phone: string;
  login: string;
  password: string;
  role: AssignableStaffRole;
  storeId: string;
  warehouseId: string;
}

export type StoreDetailResponse = Store;
