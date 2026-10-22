import type { StatusTone } from '@/components/base';
import { OrderStatus } from '@/services/order/order.type';

/** Badge tone per order status (design «Orders»). */
export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  [OrderStatus.CREATED]: 'info',
  [OrderStatus.HOLD]: 'warn',
  [OrderStatus.DEBT]: 'err',
  [OrderStatus.COMPLETED]: 'ok',
  [OrderStatus.CANCELLED]: 'neutral',
  [OrderStatus.REFUNDED]: 'neutral',
};
