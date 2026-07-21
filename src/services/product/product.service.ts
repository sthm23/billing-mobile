import { productsApi, warehouseApi } from '@/api/axios-instance'
import { BaseListResponse } from '@/models/app.models'
import type {
  CreateProduct,
  CreateProductVariantPayload,
  InventoryMovementPayload,
  Product,
  ProductDetail,
  ProductParams,
  ProductVariant,
  UpdateProductVariantPrice
} from './product.type'

const ENDPOINTS = {
  BASE: '/',
  LIST: '/',
  BY_ID: (productId: string) => `/${productId}`,
  SEARCH: (warehouseId: string) => `/search/${warehouseId}`,
  CANCEL: (productId: string) => `/${productId}/cancel`,
  VARIANTS: '/variants',
  VARIANT_BY_ID: (variantId: string) => `/variants/${variantId}`,
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

const getProducts = async (params: ProductParams = {}): Promise<BaseListResponse<Product>> => {

  const { currentPage = 1, pageSize = 10, fromDate, toDate, search } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('currentPage', currentPage.toString());
  queryParams.append('pageSize', pageSize.toString());

  if (fromDate) {
    queryParams.append('fromDate', fromDate.toISOString());
  }
  if (toDate) {
    queryParams.append('toDate', toDate.toISOString());
  }
  if (search) {
    queryParams.append('search', search);
  }

  const response = await productsApi.get<BaseListResponse<Product>>(ENDPOINTS.BASE, {
    params: queryParams,
  })

  if (!response.data.data) {
    throw new Error(response.data.data || 'Failed to fetch Products')
  }

  return response.data
}

const createProductVariants = async (body: CreateProductVariantPayload): Promise<Product> => {
  const response = await productsApi.post<Product>(ENDPOINTS.VARIANTS, body)

  if (!response.data) {
    throw new Error(response.data || 'Failed to add Product items')
  }

  return response.data
}

const searchProducts = (warehouseId: string, text: string) => {
  const queryParams = new URLSearchParams();
  queryParams.append('text', text);

  return productsApi.get<BaseListResponse<ProductVariant>>(ENDPOINTS.SEARCH(warehouseId), {
    params: queryParams
  })
}

const archiveProduct = (productId: string) => {
  return productsApi.delete<{ message: string }>(ENDPOINTS.BY_ID(productId))
}

const addInventory = (warehouseId: string, body: InventoryMovementPayload) => {
  return warehouseApi.post<{ message: string }>(ENDPOINTS.INVENTORY(warehouseId), body)
}

const updateProductVariant = (productVariantId: string, body: UpdateProductVariantPrice) => {
  return productsApi.post<ProductVariant>(ENDPOINTS.VARIANT_BY_ID(productVariantId), body)
}


export const productService = {
  createProduct,
  getProductById,
  getProducts,
  createProductVariants,
  searchProducts,
  addInventory,
  updateProductVariant,
  archiveProduct,
}
