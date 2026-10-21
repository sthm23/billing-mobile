import type { OrderCustomer } from '@/services/customer';
import type {
  CreateOrderItemPayload,
  OrderAdditionalServicePayload,
  OrderDetail,
  OrderProductVariant,
  OrderVariantAttribute,
} from '@/services/order/order.type';
import { useSyncExternalStore } from 'react';

/**
 * One order line being edited. Prices follow the backend model: the line
 * costs `retailPrice - sale` per unit; `sale` is an absolute discount.
 */
export interface CartLine {
  /** Stable key: saved item id, or the variant id for a new line */
  key: string;
  /** Saved OrderItem id (absent until the order is saved) */
  itemId?: string;
  variantId: string;
  name: string;
  /** Attribute values ("11×25 · Сосна") or the SKU */
  variantLabel: string;
  barCode: string | null;
  /** Catalogue price of the variant */
  basePrice: number;
  retailPrice: number;
  sale: number;
  costAtSale: number;
  quantity: number;
  /** Stock known from the last search / order load (hint only) */
  stock: number;
}

export interface CartState {
  /** Set once the order exists on the backend */
  orderId?: string;
  warehouseId?: string;
  customer: OrderCustomer | null;
  lines: CartLine[];
  /** Additional services of an order made on the web — sent back unchanged */
  services: OrderAdditionalServicePayload[];
}

export type AddResult = 'added' | 'outOfStock' | 'maxReached';

const EMPTY: CartState = { customer: null, lines: [], services: [] };

let state: CartState = EMPTY;
const listeners = new Set<() => void>();

function setState(next: CartState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function updateLine(key: string, patch: Partial<CartLine>) {
  setState({ ...state, lines: state.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) });
}

export function variantLabel(attributes: { value: string | null }[], sku: string): string {
  const values = attributes.map((a) => a.value).filter((v): v is string => Boolean(v));
  return values.length > 0 ? values.join(' · ') : sku;
}

function attributeValue({ value }: OrderVariantAttribute): string | null {
  if (value.valueString) return value.valueString;
  if (value.valueNumber !== null && value.valueNumber !== undefined) return String(value.valueNumber);
  if (value.valueBool !== null && value.valueBool !== undefined) return String(value.valueBool);
  return null;
}

/** Cost of the latest stock receipt — same source the web uses for `costAtSale`. */
export function latestReceiptCost(variant: Pick<OrderProductVariant, 'stockMovements'>): number {
  // Adjustments may have no cost — skip them.
  const receipts = variant.stockMovements
    .filter((m) => m.type === 'IN' && m.unitCost !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return Number(receipts[0]?.unitCost ?? 0);
}

export const cartStore = {
  get: () => state,

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Starts an empty cart (new order). */
  startNew(warehouseId?: string) {
    setState({ ...EMPTY, warehouseId });
  },

  /** Loads a saved CREATED/HOLD order for editing. */
  loadOrder(order: OrderDetail) {
    setState({
      orderId: order.id,
      warehouseId: order.warehouseId,
      customer: order.customer
        ? { id: order.customer.id, fullName: order.customer.user.fullName, phone: order.customer.user.phone }
        : null,
      services: (order.services ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        description: s.description ?? null,
      })),
      lines: order.items.map((item) => ({
        key: item.id,
        itemId: item.id,
        variantId: item.variantId,
        name: item.variant.product?.name ?? item.variant.sku,
        variantLabel: variantLabel(
          (item.variant.attributes ?? []).map((a) => ({ value: attributeValue(a) })),
          item.variant.sku
        ),
        barCode: item.variant.barCode,
        basePrice: Number(item.variant.price),
        retailPrice: Number(item.retailPrice),
        sale: Number(item.sale),
        costAtSale: Number(item.costAtSale),
        quantity: item.quantity,
        stock: item.variant.quantity,
      })),
    });
  },

  setOrderId(orderId: string) {
    setState({ ...state, orderId });
  },

  setWarehouse(warehouseId: string) {
    // Search results and stock belong to one warehouse — switching empties the cart.
    if (state.orderId || warehouseId === state.warehouseId) return;
    setState({ ...state, warehouseId, lines: [] });
  },

  setCustomer(customer: OrderCustomer | null) {
    setState({ ...state, customer });
  },

  /** Adds units of a found variant (a new line or more on the existing one); default one. */
  addVariant(variant: OrderProductVariant, quantity = 1): AddResult {
    const existing = state.lines.find((l) => l.variantId === variant.id);
    if (existing) {
      if (existing.quantity + quantity > variant.quantity) return 'maxReached';
      updateLine(existing.key, { quantity: existing.quantity + quantity, stock: variant.quantity });
      return 'added';
    }
    if (variant.quantity <= 0) return 'outOfStock';
    if (quantity > variant.quantity) return 'maxReached';

    const price = Number(variant.price);
    setState({
      ...state,
      lines: [
        ...state.lines,
        {
          key: variant.id,
          variantId: variant.id,
          name: variant.productName,
          variantLabel: variantLabel(variant.attributes, variant.sku),
          barCode: variant.barCode,
          basePrice: price,
          retailPrice: price,
          sale: 0,
          costAtSale: latestReceiptCost(variant),
          quantity,
          stock: variant.quantity,
        },
      ],
    });
    return 'added';
  },

  /** Removes one unit; the line disappears at zero. */
  decrementVariant(variantId: string) {
    const line = state.lines.find((l) => l.variantId === variantId);
    if (!line) return;
    if (line.quantity <= 1) {
      cartStore.remove(line.key);
    } else {
      updateLine(line.key, { quantity: line.quantity - 1 });
    }
  },

  setQuantity(key: string, quantity: number) {
    updateLine(key, { quantity: Math.max(1, Math.round(quantity)) });
  },

  setPrice(key: string, price: { retailPrice: number; sale: number }) {
    updateLine(key, price);
  },

  remove(key: string) {
    setState({ ...state, lines: state.lines.filter((l) => l.key !== key) });
  },
};

export function useCart(): CartState {
  return useSyncExternalStore(cartStore.subscribe, cartStore.get, cartStore.get);
}

/** Unit price after the line discount. */
export function linePrice(line: CartLine): number {
  return line.retailPrice - line.sale;
}

/**
 * Preview of the totals while the cart is edited. The backend recalculates
 * `totalAmount` on save; payment always uses the saved order.
 */
export function cartTotals(cart: CartState) {
  const sum = cart.lines.reduce((acc, l) => acc + l.retailPrice * l.quantity, 0);
  const discount = cart.lines.reduce((acc, l) => acc + l.sale * l.quantity, 0);
  const services = cart.services.reduce((acc, s) => acc + Number(s.price), 0);
  const quantity = cart.lines.reduce((acc, l) => acc + l.quantity, 0);
  return { sum, discount, total: sum - discount + services, quantity };
}

/** Body of `POST /orders/items` (orderId is added by the caller). */
export function cartToPayload(cart: CartState): Omit<CreateOrderItemPayload, 'orderId'> {
  return {
    customerId: cart.customer?.id ?? null,
    items: cart.lines.map((l) => ({
      itemId: l.itemId,
      variantId: l.variantId,
      quantity: l.quantity,
      retailPrice: l.retailPrice,
      sale: l.sale,
      costAtSale: l.costAtSale,
    })),
    additionalServices: cart.services,
  };
}
