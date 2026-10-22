import { CashboxStatus, CashboxTransaction, Payment, TransactionPayload } from '@/models/payment.model';
import { User, UserRole } from '@/models/user.model';
import { PaymentType } from '@/models/order.model';

export interface CashboxParams {
  currentPage: number;
  pageSize: number;
  /** Local day bounds for the `today` block */
  from?: string;
  to?: string;
}

/** Open cashboxes in the user's scope; amounts in all payment methods. */
export interface CashboxTodaySummary {
  openCount: number;
  /** Sum of the open cashboxes' balances */
  balance: number;
  /** Income / expense of the open cashboxes in the period */
  income: number;
  expense: number;
  lastClosedAt: string | null;
}

export interface CashboxListResponse {
  data: Payment[];
  total: number;
  currentPage: number;
  pageSize: number;
  today: CashboxTodaySummary;
}

/** Totals of one cashbox (shift), from the backend. */
export interface CashboxSummary {
  income: number;
  expense: number;
  /** Income − expense per payment method */
  byMethod: { paymentType: PaymentType; net: number }[];
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
  closedAt?: string | null;
  warehouse: {
    id: string;
    name: string;
  }
  summary: CashboxSummary
}

export interface CreateTransactionPayload extends TransactionPayload {
  cashboxId: string;
}

export interface CloseCashboxResponse {
  id: string;
  status: CashboxStatus;
  closedAt: string;
}
