import { cashboxQueryKeys } from '@/services/cashbox/cashbox.queries';
import { debtQueryKeys } from '@/services/debt/debt.queries';
import { orderQueryKeys } from '@/services/order/order.queries';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { rentalService } from './rental.service';
import type {
  CleaningConflict,
  RentalApiError,
  RentalBookingPayload,
  RentalCalendar,
  RentalCancelPayload,
  RentalDetail,
  RentalListParams,
  RentalListResponse,
  RentalPaymentPayload,
  RentalReturnLinePayload,
  RentalReturnPayload,
  RentalReturnPreview,
  RentalSummary,
  SimilarVariants,
  VariantAvailability,
} from './rental.types';

export type RentalMutationError = AxiosError<RentalApiError>;

export const rentalQueryKeys = {
  all: () => ['rental'] as const,
  lists: () => [...rentalQueryKeys.all(), 'list'] as const,
  list: (params: RentalListParams) => [...rentalQueryKeys.lists(), params] as const,
  summary: () => [...rentalQueryKeys.all(), 'summary'] as const,
  detail: (id: string) => [...rentalQueryKeys.all(), 'detail', id] as const,
  availability: (params: object) => [...rentalQueryKeys.all(), 'availability', params] as const,
  calendar: (params: object) => [...rentalQueryKeys.all(), 'calendar', params] as const,
  similar: (params: object) => [...rentalQueryKeys.all(), 'similar', params] as const,
  conflicts: (id: string, params: object) => [...rentalQueryKeys.all(), 'conflicts', id, params] as const,
};

/**
 * After any rental mutation: the rental itself, lists and counters, and what the
 * money touches — cashboxes, orders (sales summary) and debtors.
 */
function onRentalChanged(queryClient: QueryClient, rental: RentalDetail) {
  queryClient.setQueryData(rentalQueryKeys.detail(rental.id), rental);
  queryClient.invalidateQueries({ queryKey: rentalQueryKeys.all() });
  queryClient.invalidateQueries({ queryKey: cashboxQueryKeys.all() });
  queryClient.invalidateQueries({ queryKey: orderQueryKeys.all() });
  queryClient.invalidateQueries({ queryKey: debtQueryKeys.all() });
}

// -------------------------------------------------------------------- queries

export const useRentals = (params: RentalListParams): UseQueryResult<RentalListResponse> =>
  useQuery({
    queryKey: rentalQueryKeys.list(params),
    queryFn: () => rentalService.getRentals(params),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

/** Counters of the quick list filters */
export const useRentalSummary = (enabled = true): UseQueryResult<RentalSummary> =>
  useQuery({
    queryKey: rentalQueryKeys.summary(),
    queryFn: () => rentalService.getSummary(),
    enabled,
    refetchOnWindowFocus: false,
  });

export const useRental = (id: string | undefined): UseQueryResult<RentalDetail> =>
  useQuery({
    queryKey: rentalQueryKeys.detail(id ?? ''),
    queryFn: () => rentalService.getRental(id as string),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });

/** Free units of variants for [startDate, endDate) (local dates); disabled until all inputs are set */
export const useRentalAvailability = (params: {
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
  variantIds: string[];
  excludeRentalId?: string;
}): UseQueryResult<VariantAvailability[]> => {
  const { warehouseId, startDate, endDate, variantIds, excludeRentalId } = params;
  const ready = Boolean(warehouseId && startDate && endDate && startDate < endDate && variantIds.length > 0);
  const sortedIds = [...variantIds].sort();

  return useQuery({
    queryKey: rentalQueryKeys.availability({ warehouseId, startDate, endDate, variantIds: sortedIds, excludeRentalId }),
    queryFn: () =>
      rentalService.getAvailability({
        warehouseId: warehouseId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        variantIds: sortedIds,
        excludeRentalId,
      }),
    enabled: ready,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
};

export const useRentalCalendar = (params: {
  warehouseId?: string;
  from: string;
  to: string;
  variantIds?: string[];
}): UseQueryResult<RentalCalendar> =>
  useQuery({
    queryKey: rentalQueryKeys.calendar(params),
    queryFn: () =>
      rentalService.getCalendar({
        warehouseId: params.warehouseId as string,
        from: params.from,
        to: params.to,
        variantIds: params.variantIds,
      }),
    enabled: Boolean(params.warehouseId),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

/** Replacements for a variant busy on the dates */
export const useSimilarVariants = (
  params: { warehouseId: string; variantId: string; startDate: string; endDate: string; excludeRentalId?: string } | null,
): UseQueryResult<SimilarVariants> =>
  useQuery({
    queryKey: rentalQueryKeys.similar(params ?? {}),
    queryFn: () => rentalService.getSimilar(params as NonNullable<typeof params>),
    enabled: Boolean(params),
    refetchOnWindowFocus: false,
  });

/** Bookings short of units while returned items are in dry cleaning (warning only) */
export const useCleaningConflicts = (
  id: string,
  lines: RentalReturnLinePayload[],
  returnedAt?: string,
): UseQueryResult<CleaningConflict[]> =>
  useQuery({
    queryKey: rentalQueryKeys.conflicts(id, { lines, returnedAt }),
    queryFn: () => rentalService.getCleaningConflicts(id, lines, returnedAt),
    enabled: Boolean(id) && lines.length > 0,
    refetchOnWindowFocus: false,
  });

// ------------------------------------------------------------------ mutations

export const useCreateRental = (): UseMutationResult<RentalDetail, RentalMutationError, RentalBookingPayload> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => rentalService.createRental(body),
    onSuccess: (rental) => onRentalChanged(queryClient, rental),
  });
};

export const useUpdateRental = (): UseMutationResult<
  RentalDetail,
  RentalMutationError,
  { id: string; body: RentalBookingPayload }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => rentalService.updateRental(id, body),
    onSuccess: (rental) => onRentalChanged(queryClient, rental),
  });
};

export const useAddRentalPayments = (): UseMutationResult<
  RentalDetail,
  RentalMutationError,
  { id: string; body: RentalPaymentPayload }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => rentalService.addPayments(id, body),
    onSuccess: (rental) => onRentalChanged(queryClient, rental),
  });
};

export const useIssueRental = (): UseMutationResult<
  RentalDetail,
  RentalMutationError,
  { id: string; body: RentalPaymentPayload }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => rentalService.issue(id, body),
    onSuccess: (rental) => onRentalChanged(queryClient, rental),
  });
};

/** Computes a return without saving it (same numbers as the real return) */
export const usePreviewRentalReturn = (): UseMutationResult<
  RentalReturnPreview,
  RentalMutationError,
  { id: string; body: RentalReturnPayload }
> =>
  useMutation({
    mutationFn: ({ id, body }) => rentalService.previewReturn(id, body),
  });

export const useCreateRentalReturn = (): UseMutationResult<
  RentalDetail,
  RentalMutationError,
  { id: string; body: RentalReturnPayload }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => rentalService.createReturn(id, body),
    onSuccess: (rental) => onRentalChanged(queryClient, rental),
  });
};

export const useReturnCollateral = (): UseMutationResult<
  RentalDetail,
  RentalMutationError,
  { id: string; collateralId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, collateralId }) => rentalService.returnCollateral(id, collateralId),
    onSuccess: (rental) => onRentalChanged(queryClient, rental),
  });
};

export const useCancelRental = (): UseMutationResult<
  RentalDetail,
  RentalMutationError,
  { id: string; body: RentalCancelPayload }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => rentalService.cancel(id, body),
    onSuccess: (rental) => onRentalChanged(queryClient, rental),
  });
};
