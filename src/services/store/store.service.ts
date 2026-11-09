import { api } from '@/api/axios-instance';
import { monthRange } from '@/libs/date';
import {
  CreateStaffPayload,
  StaffDeactivationReason,
  StaffDetails,
  StaffListItem,
  StaffListParams,
  StaffListResponse,
  StoreDetailResponse,
  UpdateStaffPayload,
  UpdateStoreModesPayload,
} from './store.types';

const STORE_BASE_URL = '/store';
const STAFF_URL = `${STORE_BASE_URL}/staff`;

export const storeService = {
  /** GET /store/:id — OWNER only, own store; includes warehouses. */
  getStoreById: async (id: string): Promise<StoreDetailResponse> => {
    const response = await api.get<StoreDetailResponse>(`${STORE_BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * PUT /store/:id — OWNER only. Changes the store modes; `attributeIds` and
   * `brandIds` are required by the endpoint, so the current ones are sent back.
   * Both modes off → 400.
   */
  updateStoreModes: async (id: string, payload: UpdateStoreModesPayload): Promise<void> => {
    await api.put(`${STORE_BASE_URL}/${id}`, payload);
  },

  /** POST /store/staff — OWNER only, creates an employee in the owner's store. */
  createStaff: async (payload: CreateStaffPayload): Promise<void> => {
    await api.post(STAFF_URL, payload);
  },

  /** GET /store/staff — employees of the owner's store with counters. */
  getStaffList: async (params: StaffListParams): Promise<StaffListResponse> => {
    const response = await api.get<StaffListResponse>(STAFF_URL, { params });
    return response.data;
  },

  /** GET /store/staff/:id — the card; sales stats for the current local month. */
  getStaff: async (id: string): Promise<StaffDetails> => {
    const response = await api.get<StaffDetails>(`${STAFF_URL}/${id}`, { params: monthRange() });
    return response.data;
  },

  /** PUT /store/staff/:id — name, phone, login, role, warehouses. Taken phone/login → 409. */
  updateStaff: async (id: string, payload: UpdateStaffPayload): Promise<StaffListItem> => {
    const response = await api.put<StaffListItem>(`${STAFF_URL}/${id}`, payload);
    return response.data;
  },

  /** POST /store/staff/:id/deactivate — closes the login, ends all sessions. */
  deactivateStaff: async (id: string, reason: StaffDeactivationReason): Promise<StaffDetails> => {
    const response = await api.post<StaffDetails>(`${STAFF_URL}/${id}/deactivate`, { reason });
    return response.data;
  },

  /** POST /store/staff/:id/activate — restores access. */
  activateStaff: async (id: string): Promise<StaffDetails> => {
    const response = await api.post<StaffDetails>(`${STAFF_URL}/${id}/activate`);
    return response.data;
  },
};
