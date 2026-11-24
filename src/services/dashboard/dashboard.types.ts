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

/** `GET /dashboard/team` — «Показать ещё» block 1. */
export interface DashboardTeam {
  period: DashboardPeriod
  warehouseId: string | null
  /** Everyone who sold in the period, largest first */
  staff: { staffId: string; name: string; sales: number; orders: number }[]
  /** null with a warehouse filter or a single warehouse */
  warehouses: { warehouseId: string; name: string; sales: number; orders: number; share: number }[] | null
}

export type ReturnReason = 'DEFECT' | 'NOT_FIT' | 'EXTRA' | 'OTHER'

/** `GET /dashboard/activity` — «Показать ещё» block 2. */
export interface DashboardActivity {
  period: DashboardPeriod
  warehouseId: string | null
  hours: {
    days: number
    /** Store-local hours 0–23: average sales per day, total orders */
    points: { hour: number; avgSales: number; orders: number }[]
    peakHour: number | null
    quietHour: number | null
  }
  returns: {
    amount: number
    count: number
    /** returns / sales (0..); null without sales */
    share: number | null
    byReason: { reason: ReturnReason; count: number; amount: number }[]
  }
  /** null when rental is off for the store; units are «now», income is for the period */
  rental: { income: number; out: number; dueToday: number; overdue: number } | null
}
