import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { type AxiosError } from 'axios';
import { storeService } from './store.service';
import type { CreateStaffPayload, StoreDetailResponse, UpdateStoreModesPayload } from './store.types';

export const storeQueryKeys = {
  all: () => ['store'] as const,
  byId: (storeId: string) => [...storeQueryKeys.all(), 'byId', storeId] as const,
};

/**
 * Hook to fetch the current owner's store with its warehouses
 */
export const useStoreById = (storeId: string | undefined): UseQueryResult<StoreDetailResponse> => {
  const queryOptions: UseQueryOptions<StoreDetailResponse> = {
    queryKey: storeQueryKeys.byId(storeId ?? ''),
    queryFn: () => storeService.getStoreById(storeId as string),
    enabled: Boolean(storeId),
    refetchOnWindowFocus: false,
  };

  return useQuery(queryOptions);
};

/**
 * Hook to create an employee in the owner's store
 */
export const useCreateStaff = (): UseMutationResult<void, AxiosError<{ message?: string }>, CreateStaffPayload> => {
  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => storeService.createStaff(payload),
  });
};

/**
 * Hook to change the store modes (sales / rental); refreshes the store
 */
export const useUpdateStoreModes = (): UseMutationResult<
  void,
  AxiosError<{ message?: string | string[] }>,
  { storeId: string; payload: UpdateStoreModesPayload }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, payload }) => storeService.updateStoreModes(storeId, payload),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.byId(storeId) });
    },
  });
};
