import { CashboxStatus } from '@/models/payment.model';

export type CashboxStatusFilter = 'all' | CashboxStatus.OPEN | CashboxStatus.CLOSED;
