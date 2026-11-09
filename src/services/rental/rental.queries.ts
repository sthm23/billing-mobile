import { cashboxQueryKeys } from '@/services/cashbox/cashbox.queries';
import { debtQueryKeys } from '@/services/debt/debt.queries';
import { orderQueryKeys } from '@/services/order/order.queries';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { productService } from '@/services/product/product.service';
import { rentalService } from './rental.service';
import type {
  CleaningConflict,
  RentalApiError,
  RentalAgenda,
  RentalBookingPayload,
  RentalCalendar,
  RentalCancelPayload,
  RentalCleaning,
  RentalCleaningCheck,
  RentalCleaningPayload,
  RentalDetail,
  RentalListParams,
  RentalListResponse,
  RentalPaymentPayload,
  RentalReturnLinePayload,
  RentalReturnPayload,
  RentalReturnPreview,
  RentalSummary,
  RentableVariant,
  SimilarVariants,
  VariantAvailability,
} from './rental.types';

export type RentalMutationError = AxiosError<RentalApiError>;

export const rentalQueryKeys = {
  all: () => ['rental'] as const,
  lists: () => [...rentalQueryKeys.all(), 'list'] as const,
  list: (params: RentalListParams) => [...rentalQueryKeys.lists(), params] as const,
  summary: (warehouseId?: string) => [...rentalQueryKeys.all(), 'summary', warehouseId ?? 'all'] as const,
  detail: (id: string) => [...rentalQueryKeys.all(), 'detail', id] as const,
  availability: (params: object) => [...rentalQueryKeys.all(), 'availability', params] as const,
  calendar: (params: object) => [...rentalQueryKeys.all(), 'calendar', params] as const,
  agenda: (from: string, to: string, warehouseId?: string) =>
    [...rentalQueryKeys.all(), 'agenda', from, to, warehouseId ?? 'all'] as const,
  similar: (params: object) => [...rentalQueryKeys.all(), 'similar', params] as const,
  conflicts: (id: string, params: object) => [...rentalQueryKeys.all(), 'conflicts', id, params] as const,
  returnPreview: (id: string, body: RentalReturnPayload) => [...rentalQueryKeys.all(), 'return-preview', id, body] as const,
  cleanings: (params: object) => [...rentalQueryKeys.all(), 'cleanings', params] as const,
  cleaningCheck: (params: object) => [...rentalQueryKeys.all(), 'cleaning-check', params] as const,
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

/** The rental list loaded page by page (the list screen) */
export const useRentalsInfinite = (params: Omit<RentalListParams, 'currentPage'>, enabled = true) =>
  useInfiniteQuery({
    enabled,
    queryKey: [...rentalQueryKeys.lists(), 'infinite', params] as const,
    queryFn: ({ pageParam }) => rentalService.getRentals({ ...params, currentPage: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last: RentalListResponse) =>
      last.currentPage * last.pageSize < last.total ? Number(last.currentPage) + 1 : undefined,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

/**
 * Variants that can be booked in a warehouse: the product search, keeping only
 * rentable ones with a day price (the backend checks it again on save).
 */
export const useRentableVariantSearch = (warehouseId: string | undefined, text: string): UseQueryResult<RentableVariant[]> => {
  const query = text.trim();
  return useQuery({
    queryKey: [...rentalQueryKeys.all(), 'variantSearch', warehouseId, query],
    queryFn: async () => {
      const response = await productService.searchProducts(warehouseId as string, query);
      // The search row carries the rent fields too (OrderProductVariant does not declare them)
      return (response.data as unknown as RentableVariant[]).filter(
        (v) => v.canRent && Number(v.rentPricePerDay ?? 0) > 0,
      );
    },
    enabled: Boolean(warehouseId) && query.length >= 2,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
};

/** Counters of the quick list filters */
export const useRentalSummary = (enabled = true, warehouseId?: string): UseQueryResult<RentalSummary> =>
  useQuery({
    queryKey: rentalQueryKeys.summary(warehouseId),
    queryFn: () => rentalService.getSummary(warehouseId),
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
  /** Also ask for `nextFreeStart` (item card: «Освободится …») */
  nextFree?: boolean;
}): UseQueryResult<VariantAvailability[]> => {
  const { warehouseId, startDate, endDate, variantIds, excludeRentalId, nextFree } = params;
  const ready = Boolean(warehouseId && startDate && endDate && startDate < endDate && variantIds.length > 0);
  const sortedIds = [...variantIds].sort();

  return useQuery({
    queryKey: rentalQueryKeys.availability({ warehouseId, startDate, endDate, variantIds: sortedIds, excludeRentalId, nextFree }),
    queryFn: () =>
      rentalService.getAvailability({
        warehouseId: warehouseId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        variantIds: sortedIds,
        excludeRentalId,
        nextFree,
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

/** Issues and returns per day for the rentals calendar */
export const useRentalAgenda = (
  from: string,
  to: string,
  warehouseId?: string,
  enabled = true,
): UseQueryResult<RentalAgenda> =>
  useQuery({
    queryKey: rentalQueryKeys.agenda(from, to, warehouseId),
    queryFn: () => rentalService.getAgenda(from, to, warehouseId),
    placeholderData: keepPreviousData,
    enabled,
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

/**
 * Live return preview (`POST /rental/:id/returns/preview`, writes nothing):
 * recomputed whenever the body changes; the previous numbers stay on screen
 * while the next ones load. `null` body — nothing to compute.
 */
export const useRentalReturnPreview = (
  id: string,
  body: RentalReturnPayload | null,
): UseQueryResult<RentalReturnPreview, RentalMutationError> =>
  useQuery({
    queryKey: rentalQueryKeys.returnPreview(id, body ?? { items: [] }),
    queryFn: () => rentalService.previewReturn(id, body as RentalReturnPayload),
    enabled: Boolean(id) && body !== null,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: false,
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

/** Planned dry cleanings of a warehouse (optionally one variant) not finished yet */
export const useRentalCleanings = (params: {
  warehouseId?: string;
  variantId?: string;
}): UseQueryResult<RentalCleaning[]> =>
  useQuery({
    queryKey: rentalQueryKeys.cleanings(params),
    queryFn: () => rentalService.getCleanings({ warehouseId: params.warehouseId as string, variantId: params.variantId }),
    enabled: Boolean(params.warehouseId),
    refetchOnWindowFocus: false,
  });

/**
 * Live check of a planned dry cleaning (writes nothing). The caller debounces
 * the inputs; `null` — not enough to check yet. The previous answer stays on
 * screen while the next one loads.
 */
export const useCleaningCheck = (
  params: { warehouseId: string; variantId: string; startDate: string; days: number } | null,
): UseQueryResult<RentalCleaningCheck, RentalMutationError> =>
  useQuery({
    queryKey: rentalQueryKeys.cleaningCheck(params ?? {}),
    queryFn: () => rentalService.checkCleaning(params as NonNullable<typeof params>),
    enabled: Boolean(params),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: false,
  });

// ------------------------------------------------------------------ mutations

/** Occupancy, cleanings and the cashboxes (the expense / its storno) change */
function onCleaningChanged(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: rentalQueryKeys.all() });
  queryClient.invalidateQueries({ queryKey: cashboxQueryKeys.all() });
}

export const useCreateCleaning = (): UseMutationResult<RentalCleaning, RentalMutationError, RentalCleaningPayload> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => rentalService.createCleaning(body),
    onSuccess: () => onCleaningChanged(queryClient),
  });
};

export const useCancelCleaning = (): UseMutationResult<
  RentalCleaning,
  RentalMutationError,
  { id: string; cashboxId?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cashboxId }) => rentalService.cancelCleaning(id, cashboxId),
    onSuccess: () => onCleaningChanged(queryClient),
  });
};

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
