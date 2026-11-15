import type { StatusTone } from '@/components/base';
import { OrderStatus, ReturnOrderStatus, type Order } from '@/services/order/order.type';
import type { TFunction } from 'i18next';

/** Badge tone per order status (design «Orders»). */
export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  [OrderStatus.CREATED]: 'info',
  [OrderStatus.HOLD]: 'warn',
  [OrderStatus.DEBT]: 'err',
  [OrderStatus.COMPLETED]: 'ok',
  [OrderStatus.CANCELLED]: 'neutral',
  [OrderStatus.REFUNDED]: 'neutral',
};

/** Order number shown to people: the first 6 characters of the uuid, «A1B2C3». */
export function orderNo(id: string): string {
  return id.slice(0, 6).toUpperCase();
}

type OrderBadgeSource = Pick<Order, 'status' | 'isReturned' | 'totalAmount' | 'returnedAmount' | 'returnStatus'>;

/**
 * Badges of a sold order (decision 11 of the return plan): REFUNDED →
 * «Возврат · частичный / полный»; DEBT after a return → «Долг» +
 * «Частичный возврат»; a CREDIT return → «Должны клиенту». The first badge
 * is the main one (orders list).
 */
export function orderBadges(order: OrderBadgeSource, t: TFunction): { label: string; tone: StatusTone }[] {
  const badges: { label: string; tone: StatusTone }[] = [];
  if (order.returnStatus === ReturnOrderStatus.CREDIT) {
    badges.push({ label: t('orderView.badge.owedToCustomer'), tone: 'err' });
  }
  if (order.status === OrderStatus.REFUNDED) {
    const full = Number(order.returnedAmount) >= Number(order.totalAmount);
    badges.push({ label: t(full ? 'orderView.badge.returnedFull' : 'orderView.badge.returnedPartial'), tone: full ? 'neutral' : 'warn' });
    return badges;
  }
  badges.push({ label: t(`order.status.${order.status}`), tone: ORDER_STATUS_TONE[order.status] ?? 'neutral' });
  if (order.isReturned) {
    badges.push({ label: t('orderView.badge.partialReturn'), tone: 'warn' });
  }
  return badges;
}
