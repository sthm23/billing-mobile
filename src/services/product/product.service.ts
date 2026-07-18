/**
 * Copyright (c) 2025 SkipQ
 *
 * This source code is considered Developed Content.
 * LICENSE file in the root directory of this source tree.
 */

import { productsApi } from '@/api/axios-instance'
import { BaseListResponse } from '@/models/app.models'
import type { Product, ProductDetail } from './product.type'

const ENDPOINTS = {
  BASE: '/',
  LIST: '/',
  SEARCH: '/search',
  ITEMS: '/items',
  BY_ID: (productId: string) => `/${productId}`,
  CANCEL: (productId: string) => `/${productId}/cancel`,

} as const


const createProduct = async (body: CreateProductPayload): Promise<Product> => {
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

  const { currentPage = 1, pageSize = 10, status = [], fromDate, toDate, search } = params;
  const statusParam = status.join(',');
  const queryParams = new URLSearchParams();
  queryParams.append('currentPage', currentPage.toString());
  queryParams.append('pageSize', pageSize.toString());
  if (status.length > 0) {
    queryParams.append('status', statusParam);
  }
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

const createProductItems = async (body: CreateProductItemPayload): Promise<{ message: string }> => {
  const response = await productsApi.post<{ message: string }>(ENDPOINTS.ITEMS, {
    body,
  })

  if (!response.data || !response.data.message) {
    throw new Error(response.data?.message || 'Failed to add Product items')
  }

  return response.data
}

const searchProducts = (search: string) => {
  const queryParams = new URLSearchParams();
  queryParams.append('search', search);

  return productsApi.get<Product[]>(ENDPOINTS.SEARCH, {
    params: queryParams
  })
}

const createProductPayment = (productId: string, body: CreateProductPaymentPayload) => {
  return productsApi.post<{ message: string }>(`/api/Products/payment/${productId}`, body, {
    withCredentials: true
  })
}

const returnProduct = (returnProductPayload: ReturnProductItemPayload) => {
  return productsApi.post<{ message: string }>('/api/Products/return', returnProductPayload, {
    withCredentials: true
  })
}

const addPaymentToProduct = (productId: string, body: CreateProductPaymentPayload) => {
  return productsApi.post<{ message: string }>(`/api/payment`, body, {
    withCredentials: true
  })
}

const deleteProduct = (productId: string) => {
  return productsApi.delete<{ message: string }>(`/api/Products/${productId}`, {
    withCredentials: true
  })
}

const setCustomerToProduct = (body: { productId: string, customerId: string }) => {
  return productsApi.put<{ message: string }>(`/api/users/customers/set-to-Product`, body, {
    withCredentials: true
  })
}

const clearCustomerFromProduct = (productId: string) => {
  return productsApi.patch(`/api/Products/${productId}/clear-customer`, {}, {
    withCredentials: true
  })
}


export const productService = {
  createProduct,
  getProductById,
  getProducts,
  returnProduct,
  createProductItems,
  searchProducts,
  createProductPayment,
  addPaymentToProduct,
  deleteProduct,
  setCustomerToProduct,
  clearCustomerFromProduct,
}
