import type { StaffRole } from '@/models/user.model';

/** Store subscription state (backend `StoreStatus`) */
export type StoreStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED';
export type StoreSuspendReason = 'UNPAID' | 'OWNER_REQUEST' | 'OTHER';
export type StoreMode = 'sale' | 'rent';
export type AttributeType = 'STRING' | 'NUMBER' | 'BOOLEAN';

export interface AdminStoreListParams {
  pageSize?: number;
  currentPage?: number;
  search?: string;
  status?: StoreStatus;
  mode?: StoreMode;
}

export interface AdminStoreOwner {
  id: string;
  fullName: string;
  phone: string;
  login: string | null;
  isActive: boolean;
}

/** GET /admin/stores row; dates are ISO strings */
export interface AdminStoreListItem {
  id: string;
  name: string;
  status: StoreStatus;
  /** TRIAL whose trial has ended — not suspended automatically */
  trialExpired: boolean;
  trialEndsAt: string | null;
  paidUntil: string | null;
  suspendedAt: string | null;
  createdAt: string;
  salesEnabled: boolean;
  rentalEnabled: boolean;
  owner: AdminStoreOwner | null;
  warehousesCount: number;
  staffCount: number;
}

export interface AdminStoreCounts {
  total: number;
  active: number;
  trial: number;
  suspended: number;
}

export interface AdminStoreListResponse {
  currentPage: number;
  pageSize: number;
  total: number;
  data: AdminStoreListItem[];
  /** Over search + mode, before the status filter */
  counts: AdminStoreCounts;
}

export interface AdminStoreStaffItem {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  role: StaffRole;
  isOwner: boolean;
  isActive: boolean;
  warehouses: { id: string; name: string }[];
}

export interface AdminStoreAttribute {
  id: string;
  name: string;
  type: AttributeType;
  unit: string | null;
}

export interface AdminStoreDetails extends AdminStoreListItem {
  address: string | null;
  inn: string | null;
  note: string | null;
  suspendReason: StoreSuspendReason | null;
  suspendComment: string | null;
  suspendedBy: { id: string; fullName: string } | null;
  activeStaffCount: number;
  warehouses: { id: string; name: string; isActive: boolean; staffCount: number }[];
  /** First employees, owner first */
  staff: AdminStoreStaffItem[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  attributes: AdminStoreAttribute[];
}

export interface NewStoreAttribute {
  name: string;
  type: AttributeType;
  unit?: string;
}

/** POST /admin/stores */
export interface CreateAdminStorePayload {
  name: string;
  categoryId: string;
  address?: string;
  inn?: string;
  note?: string;
  warehouseName: string;
  owner: { fullName: string; phone: string; login: string; password: string };
  brandNames?: string[];
  attributeIds?: string[];
  newAttributes?: NewStoreAttribute[];
  salesEnabled: boolean;
  rentalEnabled: boolean;
}

/** PATCH /admin/stores/:id */
export interface UpdateAdminStorePayload {
  name?: string;
  salesEnabled?: boolean;
  rentalEnabled?: boolean;
}

/** GET /category — top-level categories (store directions) */
export interface CatalogCategory {
  id: string;
  name: string;
  parentId: string | null;
}

/** GET /category/brand — every brand (global) */
export interface CatalogBrand {
  id: string;
  name: string;
}

/** GET /category/attributes — attributes (global groups) */
export interface CatalogAttribute {
  id: string;
  name: string;
  type: AttributeType;
  unit: string | null;
}
