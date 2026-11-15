import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { type AxiosError } from 'axios';
import { BaseListResponse } from '@/models/app.models';
import { customerService } from './customer.service';
import type { CreateCustomerPayload, CustomerListItem } from './customer.types';

export const customerQueryKeys = {
  all: () => ['customer'] as const,
  search: (search: string) => [...customerQueryKeys.all(), 'search', search] as const,
};

/**
 * Customer search: the store's own customers by part of the name or phone
 * (empty text lists them); customers of other stores only by the full phone
 */
export const useCustomerSearch = (
  search: string,
  enabled = true
): UseQueryResult<BaseListResponse<CustomerListItem>> => {
  const text = search.trim();

  return useQuery({
    queryKey: customerQueryKeys.search(text),
    queryFn: () => customerService.searchCustomers(text),
    enabled,
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to create a customer
 */
export const useCreateCustomer = (): UseMutationResult<
  CustomerListItem,
  AxiosError<{ message?: string | string[] }>,
  CreateCustomerPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => customerService.createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all() });
    },
  });
};
