import type { BaseListResponse } from '@/models/app.models';
import type { OrderStatus, PaymentType } from '@/models/order.model';

/**
 * Rental (wedding salon) — docs/features/rental.md and
 * billing/docs/rental/03_RENTAL_API.md. Money fields come from the backend as
 * Decimal strings: show them with `Money` / `formatMoney`, never compute totals here.
 */
export enum RentalStatus {
  BOOKED = 'BOOKED',
  ISSUED = 'ISSUED',
  PARTIALLY_RETURNED = 'PARTIALLY_RETURNED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export enum CollateralType {
  PASSPORT = 'PASSPORT',
  GOLD = 'GOLD',
  OTHER = 'OTHER',
}

/** Business error codes of the rental API (`error.response.data.code`) */
export enum RentalErrorCode {
  RENTAL_DISABLED = 'RENTAL_DISABLED',
  VARIANT_NOT_RENTABLE = 'VARIANT_NOT_RENTABLE',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export interface RentalApiError {
  code?: RentalErrorCode;
  message?: string | string[];
  variantId?: string;
  available?: number;
}

export type Money = string | number;

/** Quick filters of the list (`view`), counted by GET /rental/summary */
export const RENTAL_VIEWS = ['issueToday', 'returnToday', 'overdue', 'booked', 'out', 'all'] as const;
export type RentalView = (typeof RENTAL_VIEWS)[number];
export type RentalSummary = Record<RentalView, number>;

// ------------------------------------------------------------------ payloads

export interface RentalPaymentItem {
  type: PaymentType;
  amount: number;
}

export interface RentalCollateralPayload {
  type: CollateralType;
  description: string;
}

export interface RentalItemPayload {
  variantId: string;
  quantity: number;
  /** Discount per unit */
  sale?: number;
}

export interface RentalServicePayload {
  name: string;
  price: number;
  sale?: number;
  description?: string;
}

/** POST /rental, PATCH /rental/:id (full body) */
export interface RentalBookingPayload {
  warehouseId: string;
  customerId: string;
  /** YYYY-MM-DD, salon local date */
  startDate: string;
  endDate: string;
  items: RentalItemPayload[];
  services?: RentalServicePayload[];
  notes?: string;
}

/** POST /rental/:id/payments and /issue */
export interface RentalPaymentPayload {
  payments?: RentalPaymentItem[];
  collaterals?: RentalCollateralPayload[];
  cashboxId?: string;
}

export interface RentalReturnLinePayload {
  orderItemId: string;
  quantity: number;
  cleaningDays: number;
}

export interface RentalReturnPayload {
  /** ISO with zone; omitted = now */
  returnedAt?: string;
  items: RentalReturnLinePayload[];
  penaltyAmount?: number;
  penaltyComment?: string;
  earlyReturnRefund?: number;
  refundPaymentType?: PaymentType;
  payments?: RentalPaymentItem[];
  cashboxId?: string;
}

export interface RentalCancelPayload {
  refundAmount: number;
  refundPaymentType?: PaymentType;
  reason?: string;
  cashboxId?: string;
}

// ----------------------------------------------------------------- responses

export interface VariantAvailability {
  variantId: string;
  owned: number;
  available: number;
}

export interface RentalCollateral {
  id: string;
  rentalId: string;
  type: CollateralType;
  description: string;
  receivedAt: string;
  receivedBy: string;
  returnedAt: string | null;
  returnedBy: string | null;
}

export interface RentalReturnEvent {
  id: string;
  returnedAt: string;
  penaltyAmount: Money;
  penaltyComment: string | null;
  earlyReturnRefund: Money;
  createdBy: string;
  items: {
    id: string;
    orderItemId: string;
    quantity: number;
    cleaningDays: number;
    availableFrom: string;
  }[];
}

export interface RentalOrderItem {
  id: string;
  variantId: string;
  quantity: number;
  /** Price per unit for the whole booking (rentPricePerDay × plannedDays) */
  retailPrice: Money;
  /** Discount per unit */
  sale: Money;
  returnedQuantity: number;
  variant: {
    id: string;
    sku: string;
    barCode: string | null;
    rentPricePerDay: Money | null;
    /** Dry-cleaning days suggested on return */
    defaultCleaningDays: number;
    product: { id: string; name: string };
    attributes: { value: { valueString: string | null; attribute: { name: string } } }[];
  };
}

export interface RentalOrderService {
  id: string;
  name: string;
  price: Money;
  sale: Money;
  description: string | null;
}

export interface RentalOrderPayment {
  id: string;
  type: PaymentType;
  amount: Money;
  createdAt: string;
}

export interface Rental {
  id: string;
  orderId: string;
  storeId: string;
  warehouseId: string;
  customerId: string;
  /** Noon of the local date, ISO */
  startDate: string;
  endDate: string;
  plannedDays: number;
  status: RentalStatus;
  issuedAt: string | null;
  issuedBy: string | null;
  /** Issued while the salon held no collateral */
  issuedWithoutCollateral: boolean;
  closedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  refundAmount: Money | null;
  cancelReason: string | null;
  notes: string | null;
  createdAt: string;
  overdue: boolean;
  /** Short code shown to people and searched by */
  code: string;
}

/** GET /rental/:id and the response of every rental mutation */
export interface RentalDetail extends Rental {
  collaterals: RentalCollateral[];
  returns: RentalReturnEvent[];
  order: {
    id: string;
    status: OrderStatus;
    totalAmount: Money;
    paidAmount: Money;
    dueAmount: Money;
    customer: { id: string; user: { id: string; fullName: string; phone: string } } | null;
    warehouse: { id: string; name: string };
    services: RentalOrderService[];
    payments: RentalOrderPayment[];
    items: RentalOrderItem[];
  };
}

/** Row of GET /rental */
export interface RentalListItem extends Rental {
  order: {
    id: string;
    status: OrderStatus;
    totalAmount: Money;
    paidAmount: Money;
    dueAmount: Money;
  };
  customer: { id: string; fullName: string; phone: string } | null;
  itemCount: number;
  /** Lines for thumbnails, in booking order */
  items: { variantId: string; productName: string; imageUrl: string | null; quantity: number }[];
}

export type RentalListResponse = BaseListResponse<RentalListItem>;

export interface RentalListParams {
  currentPage?: number;
  pageSize?: number;
  status?: RentalStatus[];
  /** YYYY-MM-DD */
  from?: string;
  to?: string;
  customerId?: string;
  view?: RentalView;
  /** Customer name, phone digits or rental code */
  q?: string;
  variantId?: string;
  sort?: 'asc' | 'desc';
}

export interface RentalCalendar {
  from: string;
  to: string;
  variants: {
    variantId: string;
    sku: string;
    productId: string;
    productName: string;
    owned: number;
    days: { date: string; busy: number; available: number }[];
    bookings: { rentalId: string; from: string; to: string; quantity: number }[];
  }[];
  rentals: {
    id: string;
    orderId: string;
    status: RentalStatus;
    startDate: string;
    endDate: string;
    customerName: string | null;
  }[];
}

/** Row of GET /rental/similar */
export interface SimilarVariant {
  variantId: string;
  sku: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  rentPricePerDay: Money | null;
  attributes: { name: string; value: string }[];
  owned: number;
  available: number;
}

export interface SimilarVariants {
  sameProduct: SimilarVariant[];
  sameCategory: SimilarVariant[];
}

export interface CleaningConflict {
  orderItemId: string;
  variantId: string;
  availableFrom: string;
  conflicts: {
    rentalId: string;
    orderId: string;
    customerName: string | null;
    startDate: string;
    endDate: string;
    quantity: number;
    availableAtStart: number;
  }[];
}

export interface RentalReturnPreview {
  returnedAt: string;
  items: {
    orderItemId: string;
    variantId: string;
    quantity: number;
    cleaningDays: number;
    availableFrom: string;
    plannedDays: number;
    actualDays: number;
  }[];
  penaltyAmount: Money;
  earlyReturnRefund: Money;
  maxEarlyReturnRefund: Money;
  /** Hint: days past the planned period */
  overdueDays: number;
  /** Hint for the manual penalty: list day price × units × overdue days */
  suggestedPenalty: Money;
  /** Hint: unused planned days on an early return */
  unusedDays: number;
  /** Hint for earlyReturnRefund: paid day price × units × unused days */
  unusedDaysAmount: Money;
  newTotalAmount: Money;
  paidAmount: Money;
  paymentsAmount: Money;
  dueAmount: Money;
  cashOutAmount: Money;
  paidAmountAfter: Money;
  rentalStatusAfter: RentalStatus;
  orderStatusAfter: OrderStatus;
}
