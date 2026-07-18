/**
 * Copyright (c) 2025 SkipQ
 *
 * This source code is considered Developed Content.
 * LICENSE file in the root directory of this source tree.
 */

import { BaseListResponse } from '@/models/app.models'
import {
  useMutation,
  useQuery,
  type MutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { type AxiosError } from 'axios'
import { orderService } from './order.service'
import type {
  CreateOrderPayload,
  Order,
  OrderParams,
} from './order.type'

export const orderQueryKeys = {
  all: () => ['order'] as const,
  list: (params?: OrderParams) =>
    [...orderQueryKeys.all(), 'list', params ?? {}] as const,
  byId: (orderId: string) => [...orderQueryKeys.all(), 'byId', orderId] as const,
  create: () => [...orderQueryKeys.all(), 'create'] as const,


  listFiltered: (filters: Record<string, unknown>) =>
    [...orderQueryKeys.all(), 'list', filters] as const,
  cancel: () => [...orderQueryKeys.all(), 'cancel'] as const,
  cancellation: (orderId: string, cancellationId: string) =>
    [...orderQueryKeys.all(), 'byId', orderId, 'cancellation', cancellationId] as const,
  cancellationDisabled: (orderId: string) =>
    [...orderQueryKeys.all(), 'byId', orderId, 'cancellation', 'disabled'] as const,
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
 * Submits `POST /orders` and returns the 202 envelope (order base object).
 * Errors surface as a toast — caller handles only the success path.
 */
export const useCreateOrder = (): UseMutationResult<
  Order,
  AxiosError<unknown>,
  CreateOrderPayload
> => {
  const mutationOptions: MutationOptions<
    Order,
    AxiosError<unknown>,
    CreateOrderPayload
  > = {
    mutationKey: orderQueryKeys.create(),
    mutationFn: (body): Promise<Order> => orderService.createOrder(body),
    onError: (error): void => {
      /* showToast({ type: 'error', message: getErrorMessage(error) }) */
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
    queryFn: () => orderService.getOrderById(orderId),
    enabled: Boolean(orderId) && (opts?.enabled ?? true),
    refetchInterval,
    refetchOnWindowFocus: false,
    staleTime: 0,
  }

  return useQuery(queryOptions)
}


/**
 * Hook to fetch a paginated list of orders with optional filters.
 *
 * Calls backend `GET /orders` endpoint with configurable query parameters such as currentPage, pageSize,
 * status, fromDate, toDate, and search filters.
 *
 * @param params - Query parameters (currentPage, pageSize, status, fromDate, toDate, and search)
 * @returns Query result with orders and pagination metadata
 */
export const useOrders = (params: OrderParams = {}): UseQueryResult<BaseListResponse<Order>> => {
  const queryOptions: UseQueryOptions<BaseListResponse<Order>> = {
    queryKey: orderQueryKeys.list(params),
    queryFn: () => orderService.getOrders(params),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  }

  return useQuery(queryOptions)
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
// export const useCancelOrder = (): UseMutationResult<
//   CancelOrderResponse,
//   AxiosError<unknown>,
//   CancelOrderInput
// > => {
//   const mutationOptions: MutationOptions<
//     CancelOrderResponse,
//     AxiosError<unknown>,
//     CancelOrderInput
//   > = {
//     mutationKey: orderQueryKeys.cancel(),
//     mutationFn: (input): Promise<CancelOrderResponse> => orderService.cancelOrder(input),
//     onError: (error): void => {
//       // showToast({ type: 'error', message: getErrorMessage(error) })
//     },
//   }

//   return useMutation(mutationOptions)
// }


/**
 * Polls `GET /orders/{orderId}/cancellations/{cancellationId}` every
 * 1500ms while `status === 'PENDING'`. Stops automatically when status
 * flips to `COMPLETED` or `FAILED` — and on unmount, the way every
 * TanStack Query does.
 *
 * Pass `null` for `cancellationId` while the mutation is still in flight
 * — the hook stays disabled until both ids are present.
 */
// export const useCancellation = (
//   orderId: string,
//   cancellationId: string | null
// ): UseQueryResult<CancellationStatusResponse> => {
//   // When disabled, use a distinct sentinel key so we never pollute the
//   // cache slot for a real `(orderId, cancellationId)` pair with an
//   // unresolved query. `enabled: false` guarantees the fetch never runs
//   // with the empty-string fallback below.
//   const isEnabled = Boolean(orderId) && cancellationId !== null
//   const queryKey =
//     cancellationId === null
//       ? orderQueryKeys.cancellationDisabled(orderId)
//       : orderQueryKeys.cancellation(orderId, cancellationId)

//   const queryOptions: UseQueryOptions<CancellationStatusResponse> = {
//     queryKey,
//     queryFn: () => orderService.getCancellationStatus(orderId, cancellationId ?? ''),
//     enabled: isEnabled,
//     refetchOnWindowFocus: false,
//     staleTime: 0,
//     refetchInterval: (
//       query: Query<CancellationStatusResponse, Error, CancellationStatusResponse>
//     ): number | false =>
//       query.state.data?.status === CANCELLATION_STATUS.PENDING
//         ? CANCELLATION_POLL_INTERVAL_MS
//         : false,
//   }

//   return useQuery(queryOptions)
// }