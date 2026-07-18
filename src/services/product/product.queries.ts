import { type ApiResponse } from '@/shared/api/api.types'
import { showToast } from '@/shared/lib/services/toast.service'
import { getErrorMessage } from '@/shared/lib/utils'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type Query,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import { type AxiosError } from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  CreateOrderCommentInput,
  OrderComment,
  OrderCommentThread,
} from './order-comment.types'
import {
  CANCELLATION_STATUS,
  isTerminalOrderStatus,
  type CancelOrderInput,
  type CancelOrderResponse,
  type CancellationStatusResponse,
  type CreateOrderInput,
  type CreateOrderResponse,
  type ListOrdersParams,
  type Order,
  type OrdersPage,
} from './order.types'

export const orderQueryKeys = {
  all: () => ['order'] as const,
  list: (params?: Record<string, unknown>) =>
    [...orderQueryKeys.all(), 'list', params ?? {}] as const,
  listFiltered: (filters: Record<string, unknown>) =>
    [...orderQueryKeys.all(), 'list', filters] as const,
  byId: (orderId: string) => [...orderQueryKeys.all(), 'byId', orderId] as const,
  statusPolling: (orderId: string) =>
    [...orderQueryKeys.all(), 'byId', orderId, 'status-polling'] as const,
  create: () => [...orderQueryKeys.all(), 'create'] as const,
  cancel: () => [...orderQueryKeys.all(), 'cancel'] as const,
  cancellation: (orderId: string, cancellationId: string) =>
    [...orderQueryKeys.all(), 'byId', orderId, 'cancellation', cancellationId] as const,
  cancellationDisabled: (orderId: string) =>
    [...orderQueryKeys.all(), 'byId', orderId, 'cancellation', 'disabled'] as const,
  comments: (orderId: string) => [...orderQueryKeys.all(), 'byId', orderId, 'comments'] as const,
  commentCreate: () => [...orderQueryKeys.all(), 'comment', 'create'] as const,
  attachmentDownload: () => [...orderQueryKeys.all(), 'comment', 'attachment', 'download'] as const,
}

export const POLL_INTERVAL_MS = 2000

/** ~4 minutes at 2s cadence. Caller treats `isCapped` as a soft failure. */
export const POLL_SAFETY_CAP = 120

/**
 * Cancellation polling cadence — distinct from the order-status poll
 * because the cancel flow's supplier fan-out resolves much faster than a
 * full booking.
 */
export const CANCELLATION_POLL_INTERVAL_MS = 1500

/**
 * Submits `POST /orders` and returns the 202 envelope (`orderId`, `status`).
 * Errors surface as a toast — caller handles only the success path.
 */
export const useCreateOrder = (): UseMutationResult<
  CreateOrderResponse,
  AxiosError<ApiResponse<unknown>>,
  CreateOrderInput
> => {
  const mutationOptions: MutationOptions<
    CreateOrderResponse,
    AxiosError<ApiResponse<unknown>>,
    CreateOrderInput
  > = {
    mutationKey: orderQueryKeys.create(),
    mutationFn: (body): Promise<CreateOrderResponse> => productService.createOrder(body),
    onError: (error): void => {
      showToast({ type: 'error', message: getErrorMessage(error) })
    },
  }

  return useMutation(mutationOptions)
}

/**
 * Reads a single order. Pass `polling: true` to fetch every 2s without
 * terminal-state awareness — for terminal-aware polling use
 * `useOrderStatusPolling`, which uses a distinct cache key so the two
 * hooks can safely coexist for the same `orderId`.
 *
 * `enabled` (default `true`) gates the query behind a caller-controlled flag
 * — pass `false` to keep it dormant until an interaction unlocks it.
 */
export const useOrderById = (
  orderId: string,
  opts?: { polling?: boolean; enabled?: boolean }
): UseQueryResult<Order> => {
  const refetchInterval = opts?.polling ? POLL_INTERVAL_MS : false

  const queryOptions: UseQueryOptions<Order> = {
    queryKey: orderQueryKeys.byId(orderId),
    queryFn: () => productService.getOrderById(orderId),
    enabled: Boolean(orderId) && (opts?.enabled ?? true),
    refetchInterval,
    refetchOnWindowFocus: false,
    staleTime: 0,
  }

  return useQuery(queryOptions)
}

export type UseOrderStatusPollingResult = {
  order: Order | undefined
  isTerminal: boolean
  isCapped: boolean
}

/**
 * Polls `GET /orders/{orderId}` every 2s until the order reaches a terminal
 * status (`CONFIRMED | FAILED | CANCELLED | REFUNDED`). Stops on terminal,
 * on unmount, or after exactly `POLL_SAFETY_CAP` (120) fetches (~4 min) —
 * caller treats `isCapped` as a soft failure.
 *
 * Uses a distinct query key from `useOrderById` so React Query doesn't
 * merge observers and override the terminal-stop interval.
 *
 * Caller contract: `orderId` must be stable for the hook's lifetime — to
 * poll a different order, remount the hook (e.g. via a key prop). The
 * internal poll counter is not reset on `orderId` change.
 */
export const useOrderStatusPolling = (orderId: string): UseOrderStatusPollingResult => {
  const queryClient = useQueryClient()
  const pollCountRef = useRef(0)
  const [isCapped, setIsCapped] = useState(false)

  // Returns `number | false` per TanStack's refetchInterval contract; the
  // sonarjs rule flags any union return type and can't be satisfied here.
  const computeNextInterval = useCallback(
    // eslint-disable-next-line sonarjs/function-return-type
    (next: Query<Order, Error, Order>): number | false => {
      const { data } = next.state

      if (data && isTerminalOrderStatus(data.status)) {
        return false
      }

      pollCountRef.current += 1

      if (pollCountRef.current >= POLL_SAFETY_CAP) {
        if (!isCapped) {
          setIsCapped(true)
        }

        return false
      }

      return POLL_INTERVAL_MS
    },
    [isCapped]
  )

  const queryOptions: UseQueryOptions<Order> = {
    queryKey: orderQueryKeys.statusPolling(orderId),
    queryFn: () => productService.getOrderById(orderId),
    enabled: Boolean(orderId),
    refetchOnWindowFocus: false,
    staleTime: 0,
    refetchInterval: computeNextInterval,
  }

  const query = useQuery(queryOptions)

  const order = query.data
  const isTerminal = order ? isTerminalOrderStatus(order.status) : false

  // Mirror polling result into the `byId` cache so the confirmation page reads
  // warm data. Each poll returns a fresh object reference, so use the updater
  // form and return `prev` on a no-op — that keeps `byId` observers from
  // re-rendering every 2s when nothing changed. `_updatedAt` is the audit
  // bump: any backend mutation (status, items, amounts) updates it, so a
  // single-field guard covers all observable changes.
  useEffect(() => {
    if (!order) return

    queryClient.setQueryData<Order>(orderQueryKeys.byId(orderId), (prev) => {
      if (prev && prev._updatedAt === order._updatedAt && prev.status === order.status) {
        return prev
      }

      return order
    })
  }, [order, orderId, queryClient])

  return { order, isTerminal, isCapped }
}

/**
 * Submits `POST /orders/{orderId}/cancel` and returns the 202 envelope
 * (`cancellationId`, per-item `outcome/refundAmount/feeAmount`,
 * `totalRefundAmount`, `pollUrl`). The supplier fan-out runs async — the
 * caller follows up with `useCancellation(orderId, cancellationId)`.
 *
 * The caller supplies `idempotencyKey` (typically `crypto.randomUUID()`
 * cached in component state). On a transient retry the same key replays
 * the original cancellation rather than starting a new one.
 *
 * Errors surface as a toast — caller handles only the success path.
 */
export const useCancelOrder = (): UseMutationResult<
  CancelOrderResponse,
  AxiosError<ApiResponse<unknown>>,
  CancelOrderInput
> => {
  const mutationOptions: MutationOptions<
    CancelOrderResponse,
    AxiosError<ApiResponse<unknown>>,
    CancelOrderInput
  > = {
    mutationKey: orderQueryKeys.cancel(),
    mutationFn: (input): Promise<CancelOrderResponse> => productService.cancelOrder(input),
    onError: (error): void => {
      showToast({ type: 'error', message: getErrorMessage(error) })
    },
  }

  return useMutation(mutationOptions)
}

/**
 * Polls `GET /orders/{orderId}/cancellations/{cancellationId}` every
 * 1500ms while `status === 'PENDING'`. Stops automatically when status
 * flips to `COMPLETED` or `FAILED` — and on unmount, the way every
 * TanStack Query does.
 *
 * Pass `null` for `cancellationId` while the mutation is still in flight
 * — the hook stays disabled until both ids are present.
 */
export const useCancellation = (
  orderId: string,
  cancellationId: string | null
): UseQueryResult<CancellationStatusResponse> => {
  // When disabled, use a distinct sentinel key so we never pollute the
  // cache slot for a real `(orderId, cancellationId)` pair with an
  // unresolved query. `enabled: false` guarantees the fetch never runs
  // with the empty-string fallback below.
  const isEnabled = Boolean(orderId) && cancellationId !== null
  const queryKey =
    cancellationId === null
      ? orderQueryKeys.cancellationDisabled(orderId)
      : orderQueryKeys.cancellation(orderId, cancellationId)

  const queryOptions: UseQueryOptions<CancellationStatusResponse> = {
    queryKey,
    queryFn: () => productService.getCancellationStatus(orderId, cancellationId ?? ''),
    enabled: isEnabled,
    refetchOnWindowFocus: false,
    staleTime: 0,
    refetchInterval: (
      query: Query<CancellationStatusResponse, Error, CancellationStatusResponse>
    ): number | false =>
      query.state.data?.status === CANCELLATION_STATUS.PENDING
        ? CANCELLATION_POLL_INTERVAL_MS
        : false,
  }

  return useQuery(queryOptions)
}

/**
 * Hook to fetch a paginated list of orders with optional filters.
 *
 * Calls backend `GET /orders` endpoint with configurable limit/offset pagination,
 * status, payment method, date range, and search filters.
 *
 * @param params - Query parameters (limit, offset, status, paymentMethod, dateFrom, dateTo, search, orgId)
 * @returns Query result with orders and pagination metadata
 */
export const useOrders = (params: ListOrdersParams = {}): UseQueryResult<OrdersPage> => {
  const queryOptions: UseQueryOptions<OrdersPage> = {
    queryKey: orderQueryKeys.list(params),
    queryFn: () => productService.listOrders(params),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  }

  return useQuery(queryOptions)
}

/**
 * Fetches an order's internal-staff comment thread, newest first.
 *
 * The endpoint is restricted to platform admins, so non-admin callers would
 * get a 403. Pass `enabled: false` to keep the query dormant for them rather
 * than firing a request that is guaranteed to fail.
 *
 * @param orderId - Order whose thread to load
 * @param opts - `enabled` gates the request (default `true`)
 * @returns Query result carrying the comment thread
 */
export const useOrderComments = (
  orderId: string,
  opts?: { enabled?: boolean }
): UseQueryResult<OrderCommentThread> => {
  const queryOptions: UseQueryOptions<OrderCommentThread> = {
    queryKey: orderQueryKeys.comments(orderId),
    queryFn: () => productService.getOrderComments(orderId),
    enabled: Boolean(orderId) && (opts?.enabled ?? true),
    refetchOnWindowFocus: false,
  }

  return useQuery(queryOptions)
}

/**
 * Appends a comment to an order's thread and refreshes the cached thread.
 *
 * Errors surface as a toast — the caller handles only the success path.
 *
 * @returns Mutation result for the create-comment call
 */
export const useCreateOrderComment = (): UseMutationResult<
  OrderComment,
  AxiosError<ApiResponse<unknown>>,
  CreateOrderCommentInput
> => {
  const queryClient = useQueryClient()

  const mutationOptions: MutationOptions<
    OrderComment,
    AxiosError<ApiResponse<unknown>>,
    CreateOrderCommentInput
  > = {
    mutationKey: orderQueryKeys.commentCreate(),
    mutationFn: (input): Promise<OrderComment> => productService.createOrderComment(input),
    onSuccess: (_comment, input): void => {
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.comments(input.orderId) })
    },
    onError: (error): void => {
      showToast({ type: 'error', message: getErrorMessage(error) })
    },
  }

  return useMutation(mutationOptions)
}

/**
 * Posts a comment and uploads any attached files to it. The comment is created
 * first; each file then runs the reserve → PUT-to-S3 → confirm flow. Uploads
 * run in parallel.
 *
 * On partial failure (comment created, an upload failed) the comment and any
 * successful attachments persist — the thread is append-only — so the toast
 * surfaces the error and `onSettled` refetches to show the true state.
 *
 * @returns Mutation result for the combined create-with-attachments call
 */
export const useCreateCommentWithAttachments = (): UseMutationResult<
  OrderComment,
  AxiosError<ApiResponse<unknown>>,
  CreateCommentWithAttachmentsInput
> => {
  const queryClient = useQueryClient()

  const mutationOptions: MutationOptions<
    OrderComment,
    AxiosError<ApiResponse<unknown>>,
    CreateCommentWithAttachmentsInput
  > = {
    mutationKey: orderQueryKeys.commentCreate(),
    mutationFn: async (input): Promise<OrderComment> => {
      const comment = await productService.createOrderComment({
        orderId: input.orderId,
        body: input.body,
      })

      if (input.files.length > 0) {
        await Promise.all(
          input.files.map((file) =>
            productService.uploadCommentAttachment(input.orderId, comment.id, file)
          )
        )
      }

      return comment
    },
    onError: (error): void => {
      showToast({ type: 'error', message: getErrorMessage(error) })
    },
    onSettled: (_comment, _error, input): void => {
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.comments(input.orderId) })
    },
  }

  return useMutation(mutationOptions)
}

/**
 * Fetches a presigned download URL for one attachment and triggers a browser
 * download. The presigned GET already carries `Content-Disposition: attachment`
 * with the original filename, so an anchor click saves it without navigating.
 *
 * Errors surface as a toast — the caller handles only the success path.
 *
 * @returns Mutation result for the download call
 */
export const useDownloadCommentAttachment = (): UseMutationResult<
  void,
  AxiosError<ApiResponse<unknown>>,
  DownloadCommentAttachmentInput
> => {
  const mutationOptions: MutationOptions<
    void,
    AxiosError<ApiResponse<unknown>>,
    DownloadCommentAttachmentInput
  > = {
    mutationKey: orderQueryKeys.attachmentDownload(),
    mutationFn: async (input): Promise<void> => {
      const { downloadUrl } = await productService.getCommentAttachmentDownloadUrl(
        input.orderId,
        input.commentId,
        input.attachmentId
      )

      const anchor = document.createElement('a')

      anchor.href = downloadUrl
      anchor.download = input.fileName
      anchor.rel = 'noopener'
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
    },
    onError: (error): void => {
      showToast({ type: 'error', message: getErrorMessage(error) })
    },
  }

  return useMutation(mutationOptions)
}
