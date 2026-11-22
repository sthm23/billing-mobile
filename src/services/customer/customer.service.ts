import { usersApi } from '@/api/axios-instance';
import { BaseListResponse } from '@/models/app.models';
import { UserType } from '@/models/user.model';
import type { CreateCustomerPayload, CustomerListItem } from './customer.types';

export const customerService = {
  /** GET /users/customers?search= — by name or phone. */
  searchCustomers: async (search: string, pageSize = 20): Promise<BaseListResponse<CustomerListItem>> => {
    const response = await usersApi.get<BaseListResponse<CustomerListItem>>('/customers', {
      params: { search, pageSize, currentPage: 1 },
    });
    return response.data;
  },

  /** POST /users/customers — phone must be unique. */
  createCustomer: async (payload: CreateCustomerPayload): Promise<CustomerListItem> => {
    const response = await usersApi.post<CustomerListItem>('/customers', { ...payload, type: UserType.CUSTOMER });
    return response.data;
  },
};
