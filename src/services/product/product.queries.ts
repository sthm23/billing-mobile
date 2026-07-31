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
import { productService } from './product.service'
import type {
  CreateProduct,
  Product,
  ProductParams,
  ProductVariantSearchParams,
} from './product.type'

export const productQueryKeys = {
  all: () => ['product'] as const,
  list: (params?: ProductParams) =>
    [...productQueryKeys.all(), 'list', params ?? {}] as const,
  byId: (productId: string) => [...productQueryKeys.all(), 'byId', productId] as const,
  create: () => [...productQueryKeys.all(), 'create'] as const,


  listFiltered: (filters: Record<string, unknown>) =>
    [...productQueryKeys.all(), 'list', filters] as const,
  cancel: () => [...productQueryKeys.all(), 'cancel'] as const,
  cancellation: (productId: string, cancellationId: string) =>
    [...productQueryKeys.all(), 'byId', productId, 'cancellation', cancellationId] as const,
  cancellationDisabled: (productId: string) =>
    [...productQueryKeys.all(), 'byId', productId, 'cancellation', 'disabled'] as const,
}

export const POLL_INTERVAL_MS = 2000
export const DEBOUNCE_TIME_MS = 600

/** ~4 minutes at 2s cadence. Caller treats `isCapped` as a soft failure. */
export const POLL_SAFETY_CAP = 120

/**
 * Cancellation polling cadence — distinct from the product-status poll
 * because the cancel flow's supplier fan-out resolves much faster than a
 * full booking.
 */
export const CANCELLATION_POLL_INTERVAL_MS = 1500

/**
 * Submits `POST /products` and returns the 202 envelope (product base object).
 * Errors surface as a toast — caller handles only the success path.
 */
export const useCreateProduct = (): UseMutationResult<
  Product,
  AxiosError<unknown>,
  CreateProduct
> => {
  const mutationOptions: MutationOptions<
    Product,
    AxiosError<unknown>,
    CreateProduct
  > = {
    mutationKey: productQueryKeys.create(),
    mutationFn: (body): Promise<Product> => productService.createProduct(body),
    onError: (error): void => {
      /* showToast({ type: 'error', message: getErrorMessage(error) }) */
    },
  }

  return useMutation(mutationOptions)
}

/**
 * Reads a single product. Pass `polling: true` to fetch every 2s without
 * terminal-state awareness — for terminal-aware polling use
 * `useProductStatusPolling`, which uses a distinct cache key so the two
 * hooks can safely coexist for the same `productId`.
 *
 * `enabled` (default `true`) gates the query behind a caller-controlled flag
 * — pass `false` to keep it dormant until an interaction unlocks it.
 */
export const useProductById = (
  productId: string,
  opts?: { polling?: boolean; enabled?: boolean }
): UseQueryResult<Product> => {
  const refetchInterval = opts?.polling ? POLL_INTERVAL_MS : false

  const queryOptions: UseQueryOptions<Product> = {
    queryKey: productQueryKeys.byId(productId),
    queryFn: () => productService.getProductById(productId),
    enabled: Boolean(productId) && (opts?.enabled ?? true),
    refetchInterval,
    refetchOnWindowFocus: false,
    staleTime: 0,
  }

  return useQuery(queryOptions)
}


/**
 * Hook to fetch a paginated list of products with optional filters.
 *
 * Calls backend `GET /products` endpoint with configurable query parameters such as currentPage, pageSize,
 * fromDate, toDate, and search filters.
 *
 * @param params - Query parameters (currentPage, pageSize, fromDate, toDate, and search)
 * @returns Query result with products and pagination metadata
 */
export const useProducts = (params: ProductParams = {}): UseQueryResult<BaseListResponse<Product>> => {
  const queryOptions: UseQueryOptions<BaseListResponse<Product>> = {
    queryKey: productQueryKeys.list(params),
    queryFn: () => productService.getProducts(params),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  }

  return useQuery(queryOptions)
}


export const useProductVariantSearch = (params: ProductVariantSearchParams) => {
  const { text, warehouseId } = params
  const isSearchActive = text.length > 0

  const searchQuery = useQuery({
    queryKey: ['product-search', warehouseId, text],
    queryFn: () => productService.searchProducts(warehouseId, text),
    enabled: Boolean(isSearchActive && warehouseId),
    refetchOnWindowFocus: false,
  })

  return searchQuery
}