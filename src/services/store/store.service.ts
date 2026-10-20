import { api } from '@/api/axios-instance';
import { CreateStaffPayload, StoreDetailResponse } from './store.types';

const STORE_BASE_URL = '/store';

export const storeService = {
  /** GET /store/:id — OWNER only, own store; includes warehouses. */
  getStoreById: async (id: string): Promise<StoreDetailResponse> => {
    const response = await api.get<StoreDetailResponse>(`${STORE_BASE_URL}/${id}`);
    return response.data;
  },

  /** POST /store/staff — OWNER only, creates an employee in the owner's store. */
  createStaff: async (payload: CreateStaffPayload): Promise<void> => {
    await api.post(`${STORE_BASE_URL}/staff`, payload);
  },
};
