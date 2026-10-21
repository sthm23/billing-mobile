import { BaseListResponse } from '@/models/app.models'
import { OrderProductVariant } from '@/services/order/order.type'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { type AxiosError } from 'axios'
import { productService } from './product.service'
import type {
  Category,
  CreateProduct,
  InventoryMovementPayload,
  Product,
  ProductDetail,
  ProductListResponse,
  ProductParams,
  StockMovementHistoryItem,
} from '@/models/product.model'

export const productQueryKeys = {
  all: () => ['product'] as const,
  list: (params?: ProductParams) =>
    [...productQueryKeys.all(), 'list', params ?? {}] as const,
  byId: (productId: string) => [...productQueryKeys.all(), 'byId', productId] as const,
  stockMovements: (variantId: string) => [...productQueryKeys.all(), 'stockMovements', variantId] as const,
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
): UseQueryResult<ProductDetail> => {
  const refetchInterval = opts?.polling ? POLL_INTERVAL_MS : false

  const queryOptions: UseQueryOptions<ProductDetail> = {
    queryKey: productQueryKeys.byId(productId),
    queryFn: () => productService.getProductById(productId) as Promise<ProductDetail>,
    enabled: Boolean(productId) && (opts?.enabled ?? true),
    refetchInterval,
    refetchOnWindowFocus: false,
    staleTime: 0,
  }

  return useQuery(queryOptions)
}


/**
 * Paginated product list (`GET /product`) with search, category and «Мало»
 * filters; the response also carries the chip counts.
 */
export const useProducts = (params: ProductParams = {}): UseQueryResult<ProductListResponse> => {
  const queryOptions: UseQueryOptions<ProductListResponse> = {
    queryKey: productQueryKeys.list(params),
    queryFn: () => productService.getProducts(params),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  }

  return useQuery(queryOptions)
}

/** Top categories of the store for the filter chips. */
export const useStoreCategories = (storeId: string | undefined): UseQueryResult<Category[]> =>
  useQuery({
    queryKey: ['category', 'store', storeId],
    queryFn: () => productService.getStoreCategories(storeId!),
    enabled: Boolean(storeId),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })

const HISTORY_PAGE_SIZE = 20

/** Stock movement history of a variant, loaded page by page. */
export const useStockMovements = (variantId: string) =>
  useInfiniteQuery({
    queryKey: productQueryKeys.stockMovements(variantId),
    queryFn: ({ pageParam }) => productService.getStockMovements(variantId, pageParam, HISTORY_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last: BaseListResponse<StockMovementHistoryItem>) =>
      last.currentPage * last.pageSize < last.total ? Number(last.currentPage) + 1 : undefined,
    enabled: Boolean(variantId),
    refetchOnWindowFocus: false,
  })

/** Stock receipt / write-off; refreshes products and history. */
export const useInventoryMovement = (): UseMutationResult<
  unknown,
  AxiosError<{ message?: string | string[] }>,
  { warehouseId: string; body: InventoryMovementPayload }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ warehouseId, body }) => productService.addInventory(warehouseId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all() })
    },
  })
}

/** Archives a product; refreshes the product list. */
export const useArchiveProduct = (): UseMutationResult<
  unknown,
  AxiosError<{ message?: string | string[] }>,
  string
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId) => productService.archiveProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all() })
    },
  })
}

/**
 * Searches variants of a staff warehouse by name, SKU or barcode
 * (`GET /product/search/:warehouseId?text=`). Disabled until 2+ characters.
 */
export const useProductVariantSearch = (
  warehouseId: string | undefined,
  text: string
): UseQueryResult<BaseListResponse<OrderProductVariant>> => {
  const query = text.trim()

  return useQuery({
    queryKey: [...productQueryKeys.all(), 'search', warehouseId, query],
    queryFn: () => productService.searchProducts(warehouseId!, query),
    enabled: Boolean(warehouseId) && query.length >= 2,
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  })
}
