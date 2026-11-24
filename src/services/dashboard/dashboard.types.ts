import type { PaymentType } from '@/models/order.model'

/** Query of every dashboard endpoint: local day bounds (≤ 31 days) + optional warehouse (none = whole store). */
export interface DashboardParams {
  from: string
  to: string
  warehouseId?: string
}

export type DashboardGranularity = 'hour' | 'day'

export interface DashboardPeriod {
  from: string
  to: string
  granularity: DashboardGranularity
}

/** Cash transaction categories of store expenses (`PURCHASE` comes separately). */
export type ExpenseCategory =
  | 'SALE'
  | 'DEBT_PAYMENT'
  | 'RENT'
  | 'DELIVERY'
  | 'SALARY'
  | 'PURCHASE'
  | 'RETURN'
  | 'OTHER'
  | 'RENTAL'
  | 'DRY_CLEANING'
  | 'DEFECT_COMPENSATION'

/**
 * `GET /dashboard/summary` (owner only). Event-dated: sales by sale date,
 * returns by return date. All figures come from the backend — display only.
 */
export interface DashboardSummary {
  period: DashboardPeriod
  warehouseId: string | null
  kpi: {
    sales: number
    returns: number
    revenue: number
    cost: number
    profit: number
    /** 0..1; null when revenue ≤ 0 */
    margin: number | null
    orders: number
    items: number
    avgCheck: number
  }
  /** Every hour (one-day period) or day of the period, empty ones included */
  chart: { at: string; sales: number; orders: number }[]
  payments: {
    byType: { type: PaymentType; amount: number }[]
    received: number
    debtGiven: number
  }
  cashflow: {
    income: number
    expenses: { category: ExpenseCategory; amount: number }[]
    expensesTotal: number
    purchase: number
    net: number
  }
  topProducts: { productId: string; name: string; amount: number; quantity: number }[]
  debts: {
    given: number
    repaid: number
    /** Store-wide open debt now; null with a warehouse filter */
    outstandingNow: number | null
  }
}
