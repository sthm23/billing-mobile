import { CashboxStatus, CashboxTransaction, Payment, TransactionPayload } from '@/models/payment.model';
import { User, UserRole } from '@/models/user.model';

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
  id: string
  sellerId: string
  seller: {
    role: UserRole
    user: User
  }
  status: CashboxStatus
  storeId: string
  transactions: CashboxTransaction[]
  warehouseId: string
  balance: number;
  createdAt: string;
}

export interface CreateTransactionPayload extends TransactionPayload {
  cashboxId: string;
}

export interface CloseCashboxResponse {
  id: string;
  status: CashboxStatus;
  closedAt: string;
}
