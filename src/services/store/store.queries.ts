import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { type AxiosError } from 'axios';
import { storeService } from './store.service';
import type {
  CreateStaffPayload,
  StaffDeactivationReason,
  StaffDetails,
  StaffListItem,
  StaffListParams,
  StaffListResponse,
  StoreDetailResponse,
  UpdateStaffPayload,
  UpdateStoreModesPayload,
} from './store.types';

type ApiError = AxiosError<{ message?: string | string[] }>;

export const storeQueryKeys = {
  all: () => ['store'] as const,
  byId: (storeId: string) => [...storeQueryKeys.all(), 'byId', storeId] as const,
  staff: () => [...storeQueryKeys.all(), 'staff'] as const,
  staffList: (params: StaffListParams) => [...storeQueryKeys.staff(), 'list', params] as const,
  staffById: (id: string) => [...storeQueryKeys.staff(), 'byId', id] as const,
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
 * Hook to create an employee in the owner's store; refreshes the staff list
 */
export const useCreateStaff = (): UseMutationResult<void, AxiosError<{ message?: string }>, CreateStaffPayload> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => storeService.createStaff(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.staff() });
    },
  });
};

/**
 * Employees of the owner's store (OWNER only). Keeps the previous list while
 * a new search / role filter loads.
 */
export const useStaffList = (
  params: StaffListParams,
  options: { enabled?: boolean } = {}
): UseQueryResult<StaffListResponse> =>
  useQuery({
    queryKey: storeQueryKeys.staffList(params),
    queryFn: () => storeService.getStaffList(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });

/**
 * One employee's card (OWNER only)
 */
export const useStaff = (id: string | undefined): UseQueryResult<StaffDetails> =>
  useQuery({
    queryKey: storeQueryKeys.staffById(id ?? ''),
    queryFn: () => storeService.getStaff(id as string),
    enabled: Boolean(id),
  });

/**
 * Edit an employee; refreshes the list and the card
 */
export const useUpdateStaff = (): UseMutationResult<
  StaffListItem,
  ApiError,
  { id: string; payload: UpdateStaffPayload }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => storeService.updateStaff(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.staff() });
    },
  });
};

/**
 * Deactivate an employee: stores the returned card and refreshes the list
 */
export const useDeactivateStaff = (): UseMutationResult<
  StaffDetails,
  ApiError,
  { id: string; reason: StaffDeactivationReason }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => storeService.deactivateStaff(id, reason),
    onSuccess: (details) => {
      queryClient.setQueryData(storeQueryKeys.staffById(details.id), details);
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.staff() });
    },
  });
};

/**
 * Restore an employee's access: stores the returned card and refreshes the list
 */
export const useActivateStaff = (): UseMutationResult<StaffDetails, ApiError, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storeService.activateStaff(id),
    onSuccess: (details) => {
      queryClient.setQueryData(storeQueryKeys.staffById(details.id), details);
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.staff() });
    },
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
