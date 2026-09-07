import { api } from '@/api/axios-instance';
import {
  CashboxParams,
  CashboxListResponse,
  CashboxDetailResponse,
  CreateTransactionPayload,
  CloseCashboxResponse,
} from './cashbox.types';

const CASHBOX_BASE_URL = '/cashbox';

export const cashboxService = {
  getCashboxList: async (params: CashboxParams): Promise<CashboxListResponse> => {
    const response = await api.get<CashboxListResponse>(CASHBOX_BASE_URL, { params });
    return response.data;
  },

  getCashboxById: async (id: string): Promise<CashboxDetailResponse> => {
    const response = await api.get<CashboxDetailResponse>(`${CASHBOX_BASE_URL}/${id}`);
    return response.data;
  },

  createTransaction: async (payload: CreateTransactionPayload): Promise<void> => {
    const { cashboxId, ...transactionData } = payload;
    await api.post(`${CASHBOX_BASE_URL}/${cashboxId}/transaction`, transactionData);
  },

  closeCashbox: async (id: string): Promise<CloseCashboxResponse> => {
    const response = await api.patch<CloseCashboxResponse>(`${CASHBOX_BASE_URL}/${id}/close`);
    return response.data;
  },
};
