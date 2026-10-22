import type { PaymentType } from '@/services/order/order.type'

export type DebtorsSort = 'amount' | 'date'

/** Route/customer key of DEBT orders without a customer (older data) */
export const UNASSIGNED_DEBTOR = 'unassigned'

export interface DebtorsParams {
  search?: string
  sort?: DebtorsSort
  /** Period of «Погашено» — the local month bounds */
  from?: string
  to?: string
}

/** One customer on the debtors list (all their open debts together). */
export interface Debtor {
  customerId: string
  fullName: string
  phone: string
  /** Unpaid amount over all open debts */
  total: number
  /** DEBT orders */
  ordersCount: number
  /** Manual debts */
  debtsCount: number
  lastPaymentAt: string | null
  /** Date of the oldest open debt */
  since: string
  ageDays: number
}

/** `GET /debt/debtors` — any employee sees the whole store. */
export interface DebtorsResponse {
  summary: {
    total: number
    customers: number
    /** Debts older than 30 days */
    over30: number
    /** Repaid in the period (all repayments) */
    paidInPeriod: number
  }
  data: Debtor[]
  /** DEBT orders without a customer — counted in `summary.total` */
  unassigned: {
    total: number
    ordersCount: number
    lastPaymentAt: string | null
    since: string
    ageDays: number
  } | null
}

export interface DebtHistoryPayment {
  id: string
  amount: number
  type: PaymentType
  createdAt: string
  /** Full name of the employee who took the money */
  createdBy: string | null
}

export type DebtKind = 'ORDER' | 'MANUAL'

/** An open debt of a customer: a DEBT order or a manual debt. */
export interface CustomerDebtItem {
  kind: DebtKind
  /** Order id or manual debt id */
  id: string
  /** Sale date (order) or creation date (manual debt) */
  date: string
  description: string | null
  warehouse: { id: string; name: string } | null
  total: number
  paid: number
  remaining: number
  payments: DebtHistoryPayment[]
}

/** `GET /debt/debtors/:customerId` — open debts, oldest first. */
export interface DebtorDetail {
  /** null — DEBT orders without a customer */
  customer: { id: string; fullName: string; phone: string } | null
  total: number
  debts: CustomerDebtItem[]
}

export interface RepayDebtInput {
  kind: DebtKind
  /** Order id or manual debt id */
  id: string
  /** Customer of the debt; for an order without one — the customer to attach */
  customerId?: string
  /** Open cashbox of the store; omitted — the employee's own open cashbox */
  cashboxId?: string
  payments: { type: PaymentType; amount: number }[]
}
