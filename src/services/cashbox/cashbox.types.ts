import { Payment, CashboxTransaction, CashboxStatus, TransactionPayload } from '@/models/payment.model';

export interface CashboxParams {
  currentPage: number;
  pageSize: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface CashboxListResponse {
  data: Payment[];
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface CashboxDetailResponse {
  id: string;
  sellerId: string;
  seller: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      lastname: string;
    };
  };
  status: CashboxStatus;
  storeId: string;
  warehouseId: string;
  warehouse: {
    id: string;
    name: string;
  };
  balance: number;
  totalIncome: number;
  totalExpense: number;
  transactions: CashboxTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionPayload extends TransactionPayload {
  cashboxId: string;
}

export interface CloseCashboxResponse {
  id: string;
  status: CashboxStatus;
  closedAt: string;
}
