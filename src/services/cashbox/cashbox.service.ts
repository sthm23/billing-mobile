import { api } from '@/api/axios-instance';
import {
  CashboxParams,
  CashboxListResponse,
  CashboxDetailResponse,
  CreateTransactionPayload,
  CloseCashboxResponse,
  OpenCashbox,
} from './cashbox.types';
import type { CashboxOpenPayload, Payment } from '@/models/payment.model';

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

  /** Open cashboxes of the store. */
  getOpenCashboxes: async (): Promise<OpenCashbox[]> => {
    const response = await api.get<OpenCashbox[]>(`${CASHBOX_BASE_URL}/open`);
    return response.data;
  },

  /** Opens the employee's own cashbox on one of their warehouses (any role). */
  openCashbox: async (payload: CashboxOpenPayload): Promise<Payment> => {
    const response = await api.post<Payment>(CASHBOX_BASE_URL, payload);
    return response.data;
  },

  closeCashbox: async (id: string): Promise<CloseCashboxResponse> => {
    const response = await api.patch<CloseCashboxResponse>(`${CASHBOX_BASE_URL}/${id}/close`);
    return response.data;
  },
};
