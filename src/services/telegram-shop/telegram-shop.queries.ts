import { cashboxQueryKeys } from '@/services/cashbox/cashbox.queries'
import { customerQueryKeys } from '@/services/customer/customer.queries'
import { orderQueryKeys } from '@/services/order/order.queries'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { telegramShopService } from './telegram-shop.service'
import type {
  ConfirmedOnlineOrder,
  ConfirmErrorBody,
  ConnectBotInput,
  NotifyLink,
  OnlineOrderCounts,
  OnlineOrderDetails,
  OnlineOrderListResponse,
  OnlineOrderStatus,
  TelegramBotView,
  TelegramShopState,
} from './telegram-shop.types'

type ApiError = AxiosError<{ message?: string | string[]; code?: string }>

export const ONLINE_ORDERS_PAGE_SIZE = 20

export const telegramShopQueryKeys = {
  all: () => ['telegram-shop'] as const,
  state: () => [...telegramShopQueryKeys.all(), 'state'] as const,
}

export const onlineOrderQueryKeys = {
  all: () => ['online-orders'] as const,
  list: (status: OnlineOrderStatus) => [...onlineOrderQueryKeys.all(), 'list', status] as const,
  counts: () => [...onlineOrderQueryKeys.all(), 'counts'] as const,
  detail: (id: string) => [...onlineOrderQueryKeys.all(), 'detail', id] as const,
}

/** The bot of the store and whether the service is on (owner). */
export const useTelegramShop = (enabled = true): UseQueryResult<TelegramShopState> =>
  useQuery({
    enabled,
    queryKey: telegramShopQueryKeys.state(),
    queryFn: telegramShopService.getState,
    refetchOnWindowFocus: false,
  })

/** Connects (or re-connects with a new token / address) the bot. */
export const useConnectTelegramBot = (): UseMutationResult<TelegramBotView, ApiError, ConnectBotInput> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: telegramShopService.connect,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: telegramShopQueryKeys.all() }),
  })
}

export const useDisconnectTelegramBot = (): UseMutationResult<void, ApiError, void> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: telegramShopService.disconnect,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: telegramShopQueryKeys.all() }),
  })
}

export const useCreateNotifyLink = (): UseMutationResult<NotifyLink, ApiError, void> =>
  useMutation({ mutationFn: telegramShopService.createNotifyLink })

export const useSendTelegramTest = (): UseMutationResult<void, ApiError, void> =>
  useMutation({ mutationFn: telegramShopService.sendTest })

/** Requests of one status, newest first, loaded by pages. */
export const useOnlineOrdersInfinite = (
  status: OnlineOrderStatus,
  enabled = true,
): UseInfiniteQueryResult<InfiniteData<OnlineOrderListResponse>> =>
  useInfiniteQuery({
    enabled,
    queryKey: onlineOrderQueryKeys.list(status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      telegramShopService.getOnlineOrders({ status, currentPage: pageParam, pageSize: ONLINE_ORDERS_PAGE_SIZE }),
    getNextPageParam: (last) => (last.currentPage * last.pageSize < last.total ? last.currentPage + 1 : undefined),
    refetchOnWindowFocus: false,
  })

/** Counters of every status (the profile badge): one tiny request. */
export const useOnlineOrderCounts = (enabled = true): UseQueryResult<OnlineOrderCounts> =>
  useQuery({
    enabled,
    queryKey: onlineOrderQueryKeys.counts(),
    queryFn: async () => (await telegramShopService.getOnlineOrders({ pageSize: 1 })).counts,
    refetchOnWindowFocus: false,
  })

export const useOnlineOrder = (id: string | undefined): UseQueryResult<OnlineOrderDetails> =>
  useQuery({
    enabled: Boolean(id),
    queryKey: onlineOrderQueryKeys.detail(id ?? ''),
    queryFn: () => telegramShopService.getOnlineOrder(id as string),
    refetchOnWindowFocus: false,
  })

/**
 * Confirms a request: the backend creates the customer and a sale order. Refreshes
 * the requests, orders, customers and cashboxes (an owner / manager gets one opened).
 */
export const useConfirmOnlineOrder = (): UseMutationResult<
  ConfirmedOnlineOrder,
  AxiosError<ConfirmErrorBody>,
  { id: string; warehouseId: string }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, warehouseId }) => telegramShopService.confirmOnlineOrder(id, warehouseId),
    // Also after a failure: «already handled» means what is on screen is stale
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: onlineOrderQueryKeys.all() })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all() })
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all() })
      queryClient.invalidateQueries({ queryKey: cashboxQueryKeys.all() })
    },
  })
}

export const useRejectOnlineOrder = (): UseMutationResult<
  { customerNotified: boolean },
  ApiError,
  { id: string; reason?: string }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }) => telegramShopService.rejectOnlineOrder(id, reason),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: onlineOrderQueryKeys.all() })
    },
  })
}
