import { addLocalDays, fromLocalDate, toLocalDate } from '@/screens/rental/rental-format';
import type { OrderCustomer } from '@/services/customer';
import { OrderStatus, type OrderParams } from '@/services/order/order.type';

/** Tabs of the orders list */
export type OrderTab = 'active' | 'completed';

export type PeriodKey = 'today' | 'yesterday' | '7d' | '30d' | 'custom';
export const PERIODS: PeriodKey[] = ['today', 'yesterday', '7d', '30d', 'custom'];

/** An order status, or «Должны клиенту» (a return paid out later) */
export type StatusKey = OrderStatus | 'OWED';

/** Statuses offered per tab (decision 3 of the filter plan) */
export const TAB_STATUSES: Record<OrderTab, StatusKey[]> = {
  active: [OrderStatus.CREATED, OrderStatus.HOLD],
  completed: [OrderStatus.COMPLETED, OrderStatus.DEBT, OrderStatus.REFUNDED, 'OWED'],
};

export interface OrderFilter {
  period: PeriodKey | null;
  /** Custom period, YYYY-MM-DD local days (inclusive) */
  from: string | null;
  to: string | null;
  customer: OrderCustomer | null;
  /** Nothing picked — every status of the tab. «OWED» is picked alone. */
  statuses: StatusKey[];
}

export const EMPTY_FILTER: OrderFilter = { period: null, from: null, to: null, customer: null, statuses: [] };

/** First and last local day of the period (YYYY-MM-DD), or null when no period / an unfinished custom one */
export function periodDays(filter: OrderFilter, today: string = toLocalDate(new Date())): { first: string; last: string } | null {
  switch (filter.period) {
    case 'today':
      return { first: today, last: today };
    case 'yesterday': {
      const day = addLocalDays(today, -1);
      return { first: day, last: day };
    }
    case '7d':
      return { first: addLocalDays(today, -6), last: today };
    case '30d':
      return { first: addLocalDays(today, -29), last: today };
    case 'custom':
      if (!filter.from) return null;
      return { first: filter.from, last: filter.to ?? today };
    default:
      return null;
  }
}

/**
 * Query params of the filter for a tab. Dates are the local day bounds; the
 * «Завершённые» tab filters by the sale date, «Активные» by the creation date.
 */
export function filterParams(filter: OrderFilter, tab: OrderTab): Partial<OrderParams> {
  const params: Partial<OrderParams> = {};
  const owed = filter.statuses.includes('OWED');
  const picked = filter.statuses.filter((s): s is OrderStatus => s !== 'OWED');
  const tabStatuses = TAB_STATUSES[tab].filter((s): s is OrderStatus => s !== 'OWED');
  params.status = picked.length ? picked : tabStatuses;
  if (owed) params.owedToCustomer = true;

  const days = periodDays(filter);
  if (days) {
    const fromDate = fromLocalDate(days.first);
    const toDate = fromLocalDate(days.last);
    toDate.setHours(23, 59, 59, 999);
    params.fromDate = fromDate;
    params.toDate = toDate;
    params.dateBy = tab === 'completed' ? 'sold' : 'created';
  }
  if (filter.customer) params.customerId = filter.customer.id;
  return params;
}

/** How many filters are on (for the badge on the filter button) */
export function activeFilterCount(filter: OrderFilter): number {
  return (periodDays(filter) ? 1 : 0) + (filter.customer ? 1 : 0) + (filter.statuses.length ? 1 : 0);
}

/** Toggles a status chip; «OWED» excludes the others and vice versa */
export function toggleStatus(statuses: StatusKey[], status: StatusKey): StatusKey[] {
  if (statuses.includes(status)) return statuses.filter((s) => s !== status);
  if (status === 'OWED') return ['OWED'];
  return [...statuses.filter((s) => s !== 'OWED'), status];
}
