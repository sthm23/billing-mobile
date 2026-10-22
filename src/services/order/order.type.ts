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
}

export interface OrderDetail extends Order {
    /** Only in `GET /orders/:id` */
    warehouseId: string
    payments: OrderPayment[]
    items: OrderDetailItem[]
    services: OrderAdditionalService[]


}

export interface OrderPayment {
    amount: number
    createdAt: string
    createdBy: string
    id: string
    orderId: string
    paidAt: string | null
    type: PaymentType
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
    costAtSale: number | string
    id: string
    orderId: string
    quantity: number
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
    costAtSale: number
    sale: number
}


export interface OrderItemPayload {
    /** Existing order item id; omitted for new lines */
    itemId?: string
    variantId: string
    quantity: number
    retailPrice: number
    sale: number
    costAtSale: number
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
    items: (Omit<OrderItemPayload, 'variantId'> & {
        itemId: string;
    })[]
    returnPayments: OrderPaymentPayload[]
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
