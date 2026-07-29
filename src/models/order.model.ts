export enum OrderStatus {
  CREATED = 'CREATED',
  HOLD = 'HOLD',
  DEBT = 'DEBT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentType {
  CASH = 'CASH',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
  TRANSFER = 'TRANSFER',
}

export interface Order {
  id: string;
  storeId: string;
  warehouseId: string;
  customerId: string;
  cashierId: string;
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  channel: 'ONLINE' | 'POS';
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  retailPrice: number;
  costAtSale: number;
  sale: number;
}

export interface OrderCreateRequest {
  customerId: string;
  warehouseId: string;
  items: {
    variantId: string;
    quantity: number;
  }[];
}

export interface OrderPaymentRequest {
  orderId: string;
  amount: number;
  paymentType: PaymentType;
}
