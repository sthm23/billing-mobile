import { TransactionPayload } from "@/models/payment.model"
import { Store } from "@/models/store.model"
import { Customer, Staff, User, UserRole, UserType } from "@/models/user.model"


export enum PaymentType {
    CASH = 'CASH',
    CARD = 'CARD',
    ONLINE = 'ONLINE',
    TRANSFER = 'TRANSFER'
}
export enum OrderChannel {
    POS = 'POS',
    ONLINE = 'ONLINE'
}

export enum OrderStatus {
    CREATED = 'CREATED',
    COMPLETED = 'COMPLETED',
    DEBT = 'DEBT',
    HOLD = 'HOLD',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED'
}

/**
 * `GET /orders/summary`: orders sold (COMPLETED/DEBT) in the period —
 * the staff's own sales, a manager's warehouses or the whole store (owner).
 */
export interface OrdersSummary {
    from: string
    to: string
    count: number
    total: number
    paid: number
    debt: number
}

export interface OrderParams {
    currentPage?: number
    pageSize?: number
    status?: OrderStatus[]
    fromDate?: Date
    toDate?: Date
    search?: string
    /** The working warehouse */
    warehouseId?: string
}
export interface Order {
    id: string
    store: {
        id: string
        name: string
        ownerId: string
        createdAt: string
        createdBy: string
    },
    /** `GET /orders` returns only this object — use `warehouse.id` */
    warehouse: {
        id: string
        storeId: string
        name: string
        isActive: true,
        createdAt: string
    },
    cashier: {
        id: string
        fullName: string
        phone: string
        role: UserRole,
        type: UserType,
        createdAt: string

        isActive: boolean
        storeId: string
        user: User
        userId: string
    },
    customer: {
        id: string
        user: {
            fullName: string
            phone: string
            role: UserRole,
            type: UserType,
            createdAt: string
        }
    },
    channel: OrderChannel,
    status: OrderStatus,
    totalAmount: number
    paidAmount: number
    createdAt: string
    returnedAmount: number
    isReturned: boolean
    returnedAt: string | null
    /** When the order was paid (first payment); null before */
    soldAt?: string | null
    /** Repay-by date of the debt left on the order (set on the pay screen) */
    debtDueAt?: string | null
    /** `GET /orders` list: status of the order's return, null when none */
    returnStatus?: ReturnOrderStatus | null
}

/** `ReturnedOrder.status`: DEBT — the customer still owes, CREDIT — the store owes the customer */
export enum ReturnOrderStatus {
    DEBT = 'DEBT',
    CREDIT = 'CREDIT',
    COMPLETED = 'COMPLETED'
}

/** Return reason — information only, changes no amounts */
export enum ReturnReason {
    DEFECT = 'DEFECT',
    NOT_FIT = 'NOT_FIT',
    EXTRA = 'EXTRA',
    OTHER = 'OTHER'
}

/** Name of the employee who took a payment / made a payout */
export interface OrderStaffName {
    user: { fullName: string }
}

/** A payout of a return (money given back to the customer) */
export interface ReturnPayment {
    id: string
    returnOrderId: string
    amount: number | string
    type: PaymentType
    createdAt: string
    createdBy: string
    cashier?: OrderStaffName | null
}

/** The order's return (one per order), `GET /orders/:id` → `returns` */
export interface OrderReturn {
    id: string
    orderId: string
    status: ReturnOrderStatus
    totalAmount: number | string
    reason: ReturnReason
    comment: string | null
    createdAt: string
    createdBy: string
    items: { itemId: string; quantity: number }[]
    payments: ReturnPayment[]
}

/** Computed by the backend for display (`GET /orders/:id`) */
export interface OrderSettlement {
    /** What the customer still owes on the order */
    debt: number
    /** What the store still owes the customer after a return (CREDIT) */
    owedToCustomer: number
    /** Refund already paid out */
    refundedOut: number
}

export interface OrderDetail extends Order {
    /** Only in `GET /orders/:id` */
    warehouseId: string
    payments: OrderPayment[]
    items: OrderDetailItem[]
    services: OrderAdditionalService[]
    settlement: OrderSettlement
    /** The order's return; null when the order was not returned */
    returns: OrderReturn | null
}

export interface OrderPayment {
    amount: number
    createdAt: string
    createdBy: string
    id: string
    orderId: string
    paidAt: string | null
    type: PaymentType
    /** Who took the payment */
    cashier?: OrderStaffName | null
}
/** Variant attribute as returned by `GET /orders/:id` (Prisma relation). */
export interface OrderVariantAttribute {
    value: {
        valueString: string | null
        valueNumber: string | number | null
        valueBool: boolean | null
        attribute: { name: string }
    }
}

/** Decimal fields arrive as strings ("120000") — convert with Number() before use. */
export interface OrderDetailItem {
    /** Owner/manager only — absent for other roles */
    costAtSale?: number | string
    id: string
    orderId: string
    quantity: number
    /** Units of this line taken back by the order's return */
    returnedQuantity?: number
    retailPrice: number | string
    sale: number | string
    variant: {
        id: string,
        barCode: string | null
        price: number | string
        productId: string
        sku: string
        storeId: string
        quantity: number
        product?: { id: string, name: string }
        attributes?: OrderVariantAttribute[]
    }
    variantId: string
}
export interface OrderItemCard {
    itemId?: string
    id: string
    name: string
    stock: number
    quantity: number
    price: number
    sale: number
}


export interface OrderItemPayload {
    /** Existing order item id; omitted for new lines */
    itemId?: string
    variantId: string
    quantity: number
    retailPrice: number
    sale: number
}
export interface OrderAdditionalServicePayload {
    id?: string
    name: string
    price: number | string
    description: string | null
}

export interface OrderAdditionalService extends OrderAdditionalServicePayload {
    id: string
    orderId: string
}
/** `POST /orders/items` replaces the whole order content: omitted items are deleted. */
export interface CreateOrderItemPayload {
    orderId: string
    /** null clears the customer, omitted keeps it */
    customerId?: string | null
    items: OrderItemPayload[]
    /** Required by the backend — send [] when the order has none */
    additionalServices: OrderAdditionalServicePayload[]
}

export interface ReturnOrderItemPayload {
    orderId: string,
    /** Prices and cost come from the order line on the backend */
    items: { itemId: string; quantity: number }[]
    /** Money given to the customer now; empty — debt reduced or paid out later (CREDIT) */
    returnPayments: OrderPaymentPayload[]
    reason?: ReturnReason
    comment?: string
    /** Open cashbox to pay out from; default — the employee's own */
    cashboxId?: string
}

/** `POST /orders/return` response */
export interface ReturnOrderResult {
    message: string
    returnId: string
    status: ReturnOrderStatus
    totalAmount: number
    /** Paid out to the customer now */
    paidOut: number
    cashboxId: string | null
}

/** `POST /payment/return/:returnId` — pay out what the store owes after a CREDIT return */
export interface ReturnPayoutPayload {
    returnId: string
    payments: { type: PaymentType; amount: number }[]
    cashboxId?: string
}
export interface CreateOrderPayload {
    storeId: string;
    warehouseId: string
    customerId?: string
    channel: OrderChannel
}

export interface OrderPaymentPayload {
    type: PaymentType
    amount: number
    paidAt?: Date | null
}
/**
 * The backend rejects overpayment and, when part of the total is left
 * unpaid, requires a customer (from this payload or already on the order).
 */
export interface CreateOrderPaymentPayload {
    orderId: string
    customerId?: string | null
    payments: OrderPaymentPayload[]
    /** Repay-by (ISO) when part of the order is left on debt; ignored otherwise */
    debtDueAt?: string
}

export enum DebtStatus {
    PAID = 'PAID',
    ACTIVE = 'ACTIVE'
}
export interface Debt {
    id: string
    storeId: string
    customerId: string
    description?: string
    totalAmount: number
    paidAmount: number
    status: DebtStatus
    createdAt: string
    returnedAt?: string

    customer: Customer
    store: Store
    payments: DebtPayment[]
}

export interface DebtPayment {
    id: string
    debtId: string
    amount: number
    type: PaymentType
    createdBy: string
    createdAt: string

    debt: Debt
    cashier: Staff

    cashTransactions: TransactionPayload[]
}

export interface CreateDebtPayload {
    storeId: string;
    customerId: string;
    amount: number;
    description?: string;
    createdAt?: string;
    returnedAt?: string
}
export interface CreateDebtPaymentItemDto {
    type: PaymentType
    amount: number
}
export interface DebtPaymentPayload {
    debtId: string;
    warehouseId: string;
    payments: CreateDebtPaymentItemDto[];
}

export interface DebtParams {
    currentPage?: number
    pageSize?: number
    fromDate?: Date
    toDate?: Date
    search?: string
    status?: DebtStatus[]
    customerId?: string
}

export interface OrderProductStockMovement {
    createdAt: string
    id: string
    quantity: number
    reason: string
    type: 'OUT' | 'IN'
    /** Decimal as a string; null when no cost was recorded */
    unitCost: number | string | null
    warehouseId: string
}

/** Result row of `GET /product/search/:warehouseId?text=` (staff warehouse only). */
export interface OrderProductVariant {
    barCode: string | null
    id: string
    price: number | string
    /** Stock in the searched warehouse */
    quantity: number
    sku: string
    productId: string
    productName: string
    attributes: { name: string, value: string | null }[]
    stockMovements: OrderProductStockMovement[]
}
