import { api } from '@/api/axios-instance'
import type {
  ConfirmedOnlineOrder,
  ConnectBotInput,
  NotifyLink,
  OnlineOrderDetails,
  OnlineOrderListParams,
  OnlineOrderListResponse,
  TelegramBotView,
  TelegramShopState,
} from './telegram-shop.types'

const BOT_URL = '/telegram-shop/bot'
const ONLINE_ORDERS_URL = '/online-orders'

export const telegramShopService = {
  /** GET /telegram-shop/bot — owner: is the service on, is the server set up, the bot (no secrets). */
  getState: async (): Promise<TelegramShopState> => {
    const response = await api.get<TelegramShopState>(BOT_URL)
    return response.data
  },

  /** PUT /telegram-shop/bot — checks the token, sets the webhook and the menu button, stores the token encrypted. */
  connect: async (input: ConnectBotInput): Promise<TelegramBotView> => {
    const response = await api.put<TelegramBotView>(BOT_URL, input)
    return response.data
  },

  /** DELETE /telegram-shop/bot */
  disconnect: async (): Promise<void> => {
    await api.delete(BOT_URL)
  },

  /** POST /telegram-shop/bot/notify-link — a 15-minute link that binds a chat to receive requests. */
  createNotifyLink: async (): Promise<NotifyLink> => {
    const response = await api.post<NotifyLink>(`${BOT_URL}/notify-link`, {})
    return response.data
  },

  /** POST /telegram-shop/bot/test */
  sendTest: async (): Promise<void> => {
    await api.post(`${BOT_URL}/test`, {})
  },

  /** GET /online-orders — requests of the store with counters of every status. */
  getOnlineOrders: async (params: OnlineOrderListParams): Promise<OnlineOrderListResponse> => {
    const response = await api.get<OnlineOrderListResponse>(ONLINE_ORDERS_URL, { params })
    return response.data
  },

  /** GET /online-orders/:id — a new request also carries the stock of each warehouse of the employee. */
  getOnlineOrder: async (id: string): Promise<OnlineOrderDetails> => {
    const response = await api.get<OnlineOrderDetails>(`${ONLINE_ORDERS_URL}/${id}`)
    return response.data
  },

  /** POST /online-orders/:id/confirm — creates the customer and a sale order (HOLD, channel ONLINE) on the warehouse. */
  confirmOnlineOrder: async (id: string, warehouseId: string): Promise<ConfirmedOnlineOrder> => {
    const response = await api.post<ConfirmedOnlineOrder>(`${ONLINE_ORDERS_URL}/${id}/confirm`, { warehouseId })
    return response.data
  },

  /** POST /online-orders/:id/reject — the reason is shown to the customer. */
  rejectOnlineOrder: async (id: string, reason?: string): Promise<{ customerNotified: boolean }> => {
    const response = await api.post<{ customerNotified: boolean }>(`${ONLINE_ORDERS_URL}/${id}/reject`, {
      reason: reason?.trim() || undefined,
    })
    return response.data
  },
}
