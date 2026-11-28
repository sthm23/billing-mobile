/** Telegram shop of the store (backend: `/telegram-shop/bot`, `/online-orders`; plan `billing/docs/telegram-shop/PLAN.md`). */

/** The store's bot as the app sees it: the token and secrets never reach the app. */
export interface TelegramBotView {
  slug: string
  botUsername: string
  /** https://t.me/<bot> */
  botLink: string
  /** null while the server has no Telegram settings */
  miniAppUrl: string | null
  /** Somebody pressed the «receive requests here» link */
  notifyConnected: boolean
  isActive: boolean
  createdAt: string
}

export interface TelegramShopState {
  /** The paid service is switched on for the store (by a platform admin) */
  enabled: boolean
  /** The server has its Telegram settings */
  configured: boolean
  bot: TelegramBotView | null
}

export interface ConnectBotInput {
  token: string
  slug: string
}

export interface NotifyLink {
  /** Opens the bot's private chat with the code */
  link: string
  /** Lets the owner pick a group */
  groupLink: string
  expiresAt: string
}

export type OnlineOrderStatus = 'NEW' | 'CONFIRMED' | 'REJECTED'

export const ONLINE_ORDER_STATUSES: OnlineOrderStatus[] = ['NEW', 'CONFIRMED', 'REJECTED']

export interface OnlineOrderListItem {
  id: string
  number: number
  status: OnlineOrderStatus
  fullName: string
  phone: string
  /** Region code and its (Russian) name; the district is free text */
  region: string
  regionName: string
  district: string
  comment: string | null
  createdAt: string
  handledAt: string | null
  /** The sale order created on confirmation */
  orderId: string | null
  itemsCount: number
  /** Decimal string: at the prices the customer saw */
  total: string
}

export type OnlineOrderCounts = Record<OnlineOrderStatus, number>

export interface OnlineOrderListResponse {
  currentPage: number
  pageSize: number
  total: number
  /** All statuses of the store: the badge of new requests */
  counts: OnlineOrderCounts
  data: OnlineOrderListItem[]
}

export interface OnlineOrderListParams {
  status?: OnlineOrderStatus
  currentPage?: number
  pageSize?: number
}

export interface StockShortage {
  variantId: string
  label: string
  requested: number
  available: number
}

export interface OnlineOrderItem {
  variantId: string
  label: string
  quantity: number
  priceAtRequest: string
  currentPrice: string
  imageUrl: string | null
  /** Still for sale (not archived, sale not switched off) */
  available: boolean
}

export interface WarehouseAvailability {
  id: string
  name: string
  /** Holds every line in the requested quantity */
  enough: boolean
  shortages: StockShortage[]
}

export interface OnlineOrderDetails extends OnlineOrderListItem {
  telegramUserId: string
  rejectReason: string | null
  handledBy: string | null
  /** NEW: the customer already in the system with this phone; later: the linked customer */
  customer: { id: string; fullName: string } | null
  items: OnlineOrderItem[]
  currentTotal: string
  /** NEW only: the employee's warehouses and whether each can fill the request */
  warehouses: WarehouseAvailability[]
}

export interface ConfirmedOnlineOrder {
  orderId: string
  customerId: string
  customerCreated: boolean
  /** false: the customer could not be written to (never started / blocked the bot): call them */
  customerNotified: boolean
}

/** Business error codes of the confirm call (body `code`) */
export const INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK'
export const ITEMS_UNAVAILABLE = 'ITEMS_UNAVAILABLE'
export const ONLINE_ORDER_ALREADY_HANDLED = 'ONLINE_ORDER_ALREADY_HANDLED'

/** Body of a failed confirm: NestJS puts the object it threw there */
export interface ConfirmErrorBody {
  code?: string
  message?: string | string[]
  lines?: Partial<StockShortage>[]
}
