/**
 * Copyright (c) 2025 SkipQ
 *
 * This source code is considered Developed Content.
 * LICENSE file in the root directory of this source tree.
 */

import { ordersApi, paymentsApi, usersApi } from '@/api/axios-instance'
import { BaseListResponse } from '@/models/app.models'
import type { CreateOrderItemPayload, CreateOrderPayload, CreateOrderPaymentPayload, Order, OrderDetail, OrderParams, ReturnOrderItemPayload } from './order.type'

const ENDPOINTS = {
  BASE: '/',
  LIST: '/',
  SEARCH: '/search',
  ITEMS: '/items',
  RETURN: '/return',
  BY_ID: (orderId: string) => `/${orderId}`,
  CANCEL: (orderId: string) => `/${orderId}/cancel`,
  CLEAN_CUSTOMER: (orderId: string) => `/${orderId}/clear-customer`,
  ADD_PAYMENT: (orderId: string) => `/payment/${orderId}`,
  ADD_CUSTOMER: '/customers/set-to-order'
} as const


const createOrder = async (body: CreateOrderPayload): Promise<Order> => {
  const response = await ordersApi.post<Order>(ENDPOINTS.BASE, body)

  if (!response.data) {
    throw new Error(response.data || 'Failed to create order')
  }

  return response.data
}

const getOrderById = async (orderId: string): Promise<OrderDetail> => {
  const response = await ordersApi.get<OrderDetail>(ENDPOINTS.BY_ID(orderId))

  if (!response.data) {
    throw new Error(response.data || 'Failed to fetch order')
  }

  return response.data;
}


const getOrders = async (params: OrderParams = {}): Promise<BaseListResponse<Order>> => {

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

  const response = await ordersApi.get<BaseListResponse<Order>>(ENDPOINTS.BASE, {
    params: queryParams,
  })

  if (!response.data.data) {
    throw new Error(response.data.data || 'Failed to fetch orders')
  }

  return response.data
}

const createOrderItems = async (body: CreateOrderItemPayload): Promise<{ message: string }> => {
  const response = await ordersApi.post<{ message: string }>(ENDPOINTS.ITEMS, body)

  if (!response.data || !response.data.message) {
    throw new Error(response.data?.message || 'Failed to add order items')
  }

  return response.data
}

const searchOrders = (search: string) => {
  const queryParams = new URLSearchParams();
  queryParams.append('search', search);

  return ordersApi.get<Order[]>(ENDPOINTS.SEARCH, {
    params: queryParams
  })
}

const createOrderPayment = (orderId: string, body: CreateOrderPaymentPayload) => {
  return ordersApi.post<{ message: string }>(ENDPOINTS.ADD_PAYMENT(orderId), body)
}

const returnOrder = (returnOrderPayload: ReturnOrderItemPayload) => {
  return ordersApi.post<{ message: string }>(ENDPOINTS.RETURN, returnOrderPayload)
}

const addPaymentToOrder = (body: CreateOrderPaymentPayload) => {
  return paymentsApi.post<{ message: string }>(ENDPOINTS.BASE, body)
}

const deleteOrder = (orderId: string) => {
  return ordersApi.delete<{ message: string }>(ENDPOINTS.BY_ID(orderId))
}

const setCustomerToOrder = (body: { orderId: string, customerId: string }) => {
  return usersApi.put<{ message: string }>(ENDPOINTS.ADD_CUSTOMER, body)
}

const clearCustomerFromOrder = (orderId: string) => {
  return ordersApi.patch(ENDPOINTS.CLEAN_CUSTOMER(orderId), {})
}


export const orderService = {
  createOrder,
  getOrderById,
  getOrders,
  returnOrder,
  createOrderItems,
  searchOrders,
  createOrderPayment,
  addPaymentToOrder,
  deleteOrder,
  setCustomerToOrder,
  clearCustomerFromOrder,
}
