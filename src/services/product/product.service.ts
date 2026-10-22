import { categoryApi, productsApi, warehouseApi } from '@/api/axios-instance'
import { BaseListResponse } from '@/models/app.models'
import { OrderProductVariant } from '@/services/order/order.type'
import type {
  Category,
  CreateProduct,
  CreateProductVariantPayload,
  InventoryMovementPayload,
  Product,
  ProductDetail,
  ProductListResponse,
  ProductParams,
  ProductVariant,
  StockMovementHistoryItem,
  UpdateProductVariantPrice
} from '@/models/product.model'

const ENDPOINTS = {
  BASE: '/',
  LIST: '/',
  BY_ID: (productId: string) => `/${productId}`,
  SEARCH: (warehouseId: string) => `/search/${warehouseId}`,
  CANCEL: (productId: string) => `/${productId}/cancel`,
  VARIANTS: '/variants',
  VARIANT_BY_ID: (variantId: string) => `/variants/${variantId}`,
  STOCK_MOVEMENTS: (variantId: string) => `/variants/${variantId}/stock-movements`,
  INVENTORY: (warehouseID: string) => `/${warehouseID}/inventory`,

} as const


const createProduct = async (body: CreateProduct): Promise<Product> => {
  const response = await productsApi.post<Product>(ENDPOINTS.BASE, body)

  if (!response.data) {
    throw new Error(response.data || 'Failed to create Product')
  }

  return response.data
}

const getProductById = async (productId: string): Promise<Product> => {
  const response = await productsApi.get<ProductDetail>(ENDPOINTS.BY_ID(productId))

  if (!response.data) {
    throw new Error(response.data || 'Failed to fetch Product')
  }

  return response.data;
}

/** `GET /product`: the staff's products (non-archived) with search and filters. */
const getProducts = async (params: ProductParams = {}): Promise<ProductListResponse> => {
  const { currentPage = 1, pageSize = 10, search, categoryId, lowStock } = params;

  const response = await productsApi.get<ProductListResponse>(ENDPOINTS.BASE, {
    params: {
      currentPage,
      pageSize,
      ...(search ? { search } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(lowStock ? { lowStock: true } : {}),
    },
  })

  if (!response.data.data) {
    throw new Error(response.data.data || 'Failed to fetch Products')
  }

  return response.data
}

/** Stock movements of a variant, newest first. */
const getStockMovements = async (
  variantId: string,
  currentPage: number,
  pageSize = 20
): Promise<BaseListResponse<StockMovementHistoryItem>> => {
  const response = await productsApi.get<BaseListResponse<StockMovementHistoryItem>>(
    ENDPOINTS.STOCK_MOVEMENTS(variantId),
    { params: { currentPage, pageSize } }
  )
  return response.data
}

/** Top categories of the store (filter chips). */
const getStoreCategories = async (storeId: string): Promise<Category[]> => {
  const response = await categoryApi.get<Category[]>(`/${storeId}/categories`)
  return response.data
}

const createProductVariants = async (body: CreateProductVariantPayload): Promise<Product> => {
  const response = await productsApi.post<Product>(ENDPOINTS.VARIANTS, body)

  if (!response.data) {
    throw new Error(response.data || 'Failed to add Product items')
  }

  return response.data
}

/** Searches variants by name, SKU or barcode in one of the staff's warehouses. */
const searchProducts = async (warehouseId: string, text: string): Promise<BaseListResponse<OrderProductVariant>> => {
  const response = await productsApi.get<BaseListResponse<OrderProductVariant>>(ENDPOINTS.SEARCH(warehouseId), {
    params: { text }
  })

  return response.data
}

/** Archives the product (`DELETE /product/:id`): hidden everywhere, history kept. */
const archiveProduct = (productId: string) => {
  return productsApi.delete<{ message: string }>(ENDPOINTS.BY_ID(productId))
}

/** Stock receipt or write-off in the variant's warehouse. */
const addInventory = (warehouseId: string, body: InventoryMovementPayload) => {
  return warehouseApi.post<{ message: string }>(ENDPOINTS.INVENTORY(warehouseId), body)
}

const updateProductVariant = (productVariantId: string, body: UpdateProductVariantPrice) => {
  return productsApi.put<ProductVariant>(ENDPOINTS.VARIANT_BY_ID(productVariantId), body)
}


export const productService = {
  createProduct,
  getProductById,
  getProducts,
  getStockMovements,
  getStoreCategories,
  createProductVariants,
  searchProducts,
  addInventory,
  updateProductVariant,
  archiveProduct,
}
