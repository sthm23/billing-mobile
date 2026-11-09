import { Order, PaymentType } from "./order.model"
import { Staff, User, UserRole } from "./user.model"


export interface Payment {
  id: string
  sellerId: string
  seller: {
    id: string
    role: UserRole
    user: User
  }
  status: CashboxStatus
  storeId: string
  transactions: CashboxTransaction[]
  warehouseId: string
  warehouse: {
    id: string
    name: string
  }
  balance: number
  createdAt: string
  /** Set when the cashbox is closed; null for cashboxes closed before it was recorded */
  closedAt?: string | null
}

export enum CashboxStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface CashboxTransaction {
  id: string;
  cashboxId: string
  createdById: string
  type: CashTransactionType
  category: CashTransactionCategory
  paymentType: PaymentType
  amount: number
  comment: string | null
  orderId?: string
  createdAt: string

  order?: Order
  createdBy: Staff
}
export enum CashTransactionCategory {
  SALE = 'SALE',
  DEBT_PAYMENT = 'DEBT_PAYMENT',
  /** Premises rent (expense) */
  RENT = 'RENT',
  /** Income of a rental order (set by the backend, not picked by hand) */
  RENTAL = 'RENTAL',
  /** Planned dry cleaning of a rental item: expense, its cancel is income (set by the backend) */
  DRY_CLEANING = 'DRY_CLEANING',
  DELIVERY = 'DELIVERY',
  SALARY = 'SALARY',
  PURCHASE = 'PURCHASE',
  RETURN = 'RETURN',
  OTHER = 'OTHER',
}

export enum CashTransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

/** `POST /cashbox` (owner/manager): the store comes from the token, a new cashbox is always OPEN. */
export interface CashboxOpenPayload {
  warehouseId: string;
  /** Opening cash, default 0 */
  balance?: number;
}

export interface TransactionPayload {
  type: CashTransactionType
  category: CashTransactionCategory
  paymentType: PaymentType
  amount: number
  comment: string
  orderId: string | null
}
