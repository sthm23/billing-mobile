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

/** Why an employee was deactivated (`Staff.deactivationReason`) */
export const STAFF_DEACTIVATION_REASONS = ['LEFT', 'TEMPORARY', 'OTHER'] as const;
export type StaffDeactivationReason = (typeof STAFF_DEACTIVATION_REASONS)[number];

/** GET /store/staff filters (OWNER only, own store) */
export interface StaffListParams {
  /** Part of the full name, phone or login */
  search?: string;
  role?: StaffRole;
  /** Employees with access to this warehouse; the owner is always listed */
  warehouseId?: string;
}

/** One employee in GET /store/staff (`id` is the Staff id) */
export interface StaffListItem {
  id: string;
  userId: string;
  fullName: string;
  /** Full international number, e.g. +998901234567 */
  phone: string;
  login: string | null;
  role: StaffRole;
  /** Store owner: all warehouses, not editable from the app */
  isOwner: boolean;
  isActive: boolean;
  warehouses: { id: string; name: string }[];
  createdAt: string;
}

export interface StaffListResponse {
  /** Owner first, then active, then deactivated; filtered by `role` */
  data: StaffListItem[];
  /** Over search + warehouse, not the role filter (role chips) */
  counts: {
    total: number;
    active: number;
    byRole: Partial<Record<StaffRole, number>>;
  };
}

/** GET /store/staff/:id — the employee card */
export interface StaffDetails extends StaffListItem {
  deactivatedAt: string | null;
  deactivationReason: StaffDeactivationReason | null;
  deactivatedBy: { id: string; fullName: string } | null;
  /** Sold orders where the employee is the cashier, in [from, to) */
  stats: { from: string; to: string; salesTotal: number; ordersCount: number };
}

/** PUT /store/staff/:id — only the changed fields */
export interface UpdateStaffPayload {
  fullName?: string;
  phone?: string;
  login?: string;
  role?: AssignableStaffRole;
  /** Replaces the employee's warehouses (at least one) */
  warehouseIds?: string[];
}

/** PUT /store/:id body for the store modes (at least one stays on) */
export interface UpdateStoreModesPayload {
  salesEnabled: boolean;
  rentalEnabled: boolean;
  /** Current ones: the endpoint replaces the lists */
  attributeIds: string[];
  brandIds: string[];
}
