import { api } from '@/api/axios-instance';
import type {
  AdminStoreDetails,
  AdminStoreListParams,
  AdminStoreListResponse,
  AdminStoreStaffItem,
  CatalogAttribute,
  CatalogBrand,
  CatalogCategory,
  CreateAdminStorePayload,
  StoreSuspendReason,
  UpdateAdminStorePayload,
} from './admin-store.types';

const BASE_URL = '/admin/stores';
/** Attributes are few (global groups); one page covers them */
const ATTRIBUTES_PAGE_SIZE = 100;

/** Store administration — platform ADMIN only (backend `AdminGuard`). */
export const adminStoreService = {
  /** GET /admin/stores — search, status / mode filters, pages, status counts */
  getStores: async (params: AdminStoreListParams): Promise<AdminStoreListResponse> => {
    const response = await api.get<AdminStoreListResponse>(BASE_URL, { params });
    return response.data;
  },

  /** GET /admin/stores/:id — the store card */
  getStore: async (id: string): Promise<AdminStoreDetails> => {
    const response = await api.get<AdminStoreDetails>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /** GET /admin/stores/:id/staff — every employee, read-only */
  getStaff: async (id: string): Promise<AdminStoreStaffItem[]> => {
    const response = await api.get<AdminStoreStaffItem[]>(`${BASE_URL}/${id}/staff`);
    return response.data;
  },

  /** POST /admin/stores — store + first warehouse + new owner; taken login/phone → 409 */
  createStore: async (payload: CreateAdminStorePayload): Promise<AdminStoreDetails> => {
    const response = await api.post<AdminStoreDetails>(BASE_URL, payload);
    return response.data;
  },

  /** PATCH /admin/stores/:id — rename / modes (at least one stays on) */
  updateStore: async (id: string, payload: UpdateAdminStorePayload): Promise<AdminStoreDetails> => {
    const response = await api.patch<AdminStoreDetails>(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  /** POST /admin/stores/:id/suspend */
  suspendStore: async (
    id: string,
    payload: { reason: StoreSuspendReason; comment?: string },
  ): Promise<AdminStoreDetails> => {
    const response = await api.post<AdminStoreDetails>(`${BASE_URL}/${id}/suspend`, payload);
    return response.data;
  },

  /** GET /category — top-level categories with children; the form uses the top level */
  getRootCategories: async (): Promise<CatalogCategory[]> => {
    const response = await api.get<CatalogCategory[]>('/category');
    return response.data;
  },

  /** GET /category/brand — all brands */
  getBrands: async (): Promise<CatalogBrand[]> => {
    const response = await api.get<CatalogBrand[]>('/category/brand');
    return response.data;
  },

  /** GET /category/attributes — all attributes */
  getAttributes: async (): Promise<CatalogAttribute[]> => {
    const response = await api.get<{ data: CatalogAttribute[] }>('/category/attributes', {
      params: { pageSize: ATTRIBUTES_PAGE_SIZE, currentPage: 1 },
    });
    return response.data.data;
  },

  /** POST /warehouse (ADMIN) — new warehouse of a store; the owner gets access */
  createWarehouse: async (storeId: string, name: string): Promise<void> => {
    await api.post('/warehouse', { storeId, name });
  },

  /** POST /admin/stores/:id/resume — `paidUntil` (ISO date) makes it ACTIVE */
  resumeStore: async (id: string, payload: { paidUntil?: string }): Promise<AdminStoreDetails> => {
    const response = await api.post<AdminStoreDetails>(`${BASE_URL}/${id}/resume`, payload);
    return response.data;
  },
};
