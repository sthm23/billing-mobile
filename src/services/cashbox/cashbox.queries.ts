import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { type AxiosError } from 'axios';
import { cashboxService } from './cashbox.service';
import type {
  CashboxParams,
  CashboxListResponse,
  CashboxDetailResponse,
  CreateTransactionPayload,
  CloseCashboxResponse,
} from './cashbox.types';

export const cashboxQueryKeys = {
  all: () => ['cashbox'] as const,
  list: (params?: CashboxParams) => [...cashboxQueryKeys.all(), 'list', params ?? {}] as const,
  byId: (cashboxId: string) => [...cashboxQueryKeys.all(), 'byId', cashboxId] as const,
  transactions: (cashboxId: string) => [...cashboxQueryKeys.all(), cashboxId, 'transactions'] as const,
};

/**
 * Hook to fetch paginated list of cashboxes
 */
export const useCashboxList = (
  params: CashboxParams
): UseQueryResult<CashboxListResponse> => {
  const queryOptions: UseQueryOptions<CashboxListResponse> = {
    queryKey: cashboxQueryKeys.list(params),
    queryFn: () => cashboxService.getCashboxList(params),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  };

  return useQuery(queryOptions);
};

/**
 * Hook to fetch single cashbox details with transactions
 */
export const useCashboxById = (
  cashboxId: string,
  opts?: { enabled?: boolean; refetchInterval?: number | false }
): UseQueryResult<CashboxDetailResponse> => {
  const queryOptions: UseQueryOptions<CashboxDetailResponse> = {
    queryKey: cashboxQueryKeys.byId(cashboxId),
    queryFn: () => cashboxService.getCashboxById(cashboxId),
    enabled: Boolean(cashboxId) && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval ?? false,
    refetchOnWindowFocus: false,
  };

  return useQuery(queryOptions);
};

/**
 * Hook to create a new transaction (income or expense)
 */
export const useCreateTransaction = (): UseMutationResult<
  void,
  AxiosError<unknown>,
  CreateTransactionPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) =>
      cashboxService.createTransaction(payload),
    onSuccess: (_, variables) => {
      // Invalidate cashbox details to refetch updated data
      queryClient.invalidateQueries({
        queryKey: cashboxQueryKeys.byId(variables.cashboxId),
      });
      // Invalidate list to update totals
      queryClient.invalidateQueries({
        queryKey: cashboxQueryKeys.all(),
      });
    },
  });
};

/**
 * Hook to close a cashbox
 */
export const useCloseCashbox = (): UseMutationResult<
  CloseCashboxResponse,
  AxiosError<unknown>,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cashboxId: string) => cashboxService.closeCashbox(cashboxId),
    onSuccess: (_, cashboxId) => {
      // Invalidate cashbox details
      queryClient.invalidateQueries({
        queryKey: cashboxQueryKeys.byId(cashboxId),
      });
      // Invalidate list to update status
      queryClient.invalidateQueries({
        queryKey: cashboxQueryKeys.all(),
      });
    },
  });
};
