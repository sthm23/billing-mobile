import { api } from '@/api/axios-instance';
import type {
  CleaningConflict,
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

const RENTAL_BASE_URL = '/rental';

/** GET /rental query: lists become comma-separated, empty values are left out */
function listQuery(params: RentalListParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
    currentPage: params.currentPage ?? 1,
    pageSize: params.pageSize ?? 10,
  };
  if (params.status?.length) query.status = params.status.join(',');
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  if (params.customerId) query.customerId = params.customerId;
  if (params.view && params.view !== 'all') query.view = params.view;
  if (params.q?.trim()) query.q = params.q.trim();
  if (params.variantId) query.variantId = params.variantId;
  if (params.sort) query.sort = params.sort;
  if (params.sortBy) query.sortBy = params.sortBy;
  return query;
}

/**
 * Rental API (billing/docs/rental/03_RENTAL_API.md). Prices, totals and
 * availability come from the backend; mutations return the fresh rental details.
 */
export const rentalService = {
  getRentals: async (params: RentalListParams): Promise<RentalListResponse> => {
    const response = await api.get<RentalListResponse>(RENTAL_BASE_URL, { params: listQuery(params) });
    return response.data;
  },

  getSummary: async (): Promise<RentalSummary> => {
    const response = await api.get<RentalSummary>(`${RENTAL_BASE_URL}/summary`);
    return response.data;
  },

  getRental: async (id: string): Promise<RentalDetail> => {
    const response = await api.get<RentalDetail>(`${RENTAL_BASE_URL}/${id}`);
    return response.data;
  },

  getAvailability: async (params: {
    warehouseId: string;
    startDate: string;
    endDate: string;
    variantIds: string[];
    excludeRentalId?: string;
  }): Promise<VariantAvailability[]> => {
    const response = await api.get<VariantAvailability[]>(`${RENTAL_BASE_URL}/availability`, {
      params: { ...params, variantIds: params.variantIds.join(',') },
    });
    return response.data;
  },

  getCalendar: async (params: {
    warehouseId: string;
    from: string;
    to: string;
    variantIds?: string[];
  }): Promise<RentalCalendar> => {
    const response = await api.get<RentalCalendar>(`${RENTAL_BASE_URL}/calendar`, {
      params: { ...params, variantIds: params.variantIds?.length ? params.variantIds.join(',') : undefined },
    });
    return response.data;
  },

  getSimilar: async (params: {
    warehouseId: string;
    variantId: string;
    startDate: string;
    endDate: string;
    excludeRentalId?: string;
  }): Promise<SimilarVariants> => {
    const response = await api.get<SimilarVariants>(`${RENTAL_BASE_URL}/similar`, { params });
    return response.data;
  },

  createRental: async (body: RentalBookingPayload): Promise<RentalDetail> => {
    const response = await api.post<RentalDetail>(RENTAL_BASE_URL, body);
    return response.data;
  },

  updateRental: async (id: string, body: RentalBookingPayload): Promise<RentalDetail> => {
    const response = await api.patch<RentalDetail>(`${RENTAL_BASE_URL}/${id}`, body);
    return response.data;
  },

  addPayments: async (id: string, body: RentalPaymentPayload): Promise<RentalDetail> => {
    const response = await api.post<RentalDetail>(`${RENTAL_BASE_URL}/${id}/payments`, body);
    return response.data;
  },

  issue: async (id: string, body: RentalPaymentPayload): Promise<RentalDetail> => {
    const response = await api.post<RentalDetail>(`${RENTAL_BASE_URL}/${id}/issue`, body);
    return response.data;
  },

  getCleaningConflicts: async (
    id: string,
    lines: RentalReturnLinePayload[],
    returnedAt?: string,
  ): Promise<CleaningConflict[]> => {
    const response = await api.get<CleaningConflict[]>(`${RENTAL_BASE_URL}/${id}/cleaning-conflicts`, {
      params: {
        items: lines.map((l) => `${l.orderItemId}:${l.quantity}:${l.cleaningDays}`).join(','),
        returnedAt,
      },
    });
    return response.data;
  },

  previewReturn: async (id: string, body: RentalReturnPayload): Promise<RentalReturnPreview> => {
    const response = await api.post<RentalReturnPreview>(`${RENTAL_BASE_URL}/${id}/returns/preview`, body);
    return response.data;
  },

  createReturn: async (id: string, body: RentalReturnPayload): Promise<RentalDetail> => {
    const response = await api.post<RentalDetail>(`${RENTAL_BASE_URL}/${id}/returns`, body);
    return response.data;
  },

  returnCollateral: async (id: string, collateralId: string): Promise<RentalDetail> => {
    const response = await api.post<RentalDetail>(`${RENTAL_BASE_URL}/${id}/collaterals/${collateralId}/return`);
    return response.data;
  },

  cancel: async (id: string, body: RentalCancelPayload): Promise<RentalDetail> => {
    const response = await api.post<RentalDetail>(`${RENTAL_BASE_URL}/${id}/cancel`, body);
    return response.data;
  },
};
