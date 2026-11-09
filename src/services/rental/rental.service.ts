import { api } from '@/api/axios-instance';
import type {
  CleaningConflict,
  RentalBookingPayload,
  RentalAgenda,
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
    /** Also return `nextFreeStart` per variant */
    nextFree?: boolean;
  }): Promise<VariantAvailability[]> => {
    const response = await api.get<VariantAvailability[]>(`${RENTAL_BASE_URL}/availability`, {
      params: {
        ...params,
        variantIds: params.variantIds.join(','),
        nextFree: params.nextFree ? 'true' : undefined,
      },
    });
    return response.data;
  },

  /** Issues and returns per salon day, at most 93 days */
  getAgenda: async (from: string, to: string): Promise<RentalAgenda> => {
    const response = await api.get<RentalAgenda>(`${RENTAL_BASE_URL}/agenda`, { params: { from, to } });
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

  /** Planned dry cleaning (R13): does one unit fit on these days? Saves nothing */
  checkCleaning: async (params: {
    warehouseId: string;
    variantId: string;
    startDate: string;
    days: number;
  }): Promise<RentalCleaningCheck> => {
    const response = await api.get<RentalCleaningCheck>(`${RENTAL_BASE_URL}/cleanings/check`, { params });
    return response.data;
  },

  /** Active cleanings not finished before `from` (default today) */
  getCleanings: async (params: {
    warehouseId: string;
    variantId?: string;
    from?: string;
    to?: string;
  }): Promise<RentalCleaning[]> => {
    const response = await api.get<RentalCleaning[]>(`${RENTAL_BASE_URL}/cleanings`, { params });
    return response.data;
  },

  /** OWNER/MANAGER; the expense is written to the cashbox at once */
  createCleaning: async (body: RentalCleaningPayload): Promise<RentalCleaning> => {
    const response = await api.post<RentalCleaning>(`${RENTAL_BASE_URL}/cleanings`, body);
    return response.data;
  },

  /** OWNER/MANAGER, before the start only; the amount comes back to a cashbox */
  cancelCleaning: async (id: string, cashboxId?: string): Promise<RentalCleaning> => {
    const response = await api.post<RentalCleaning>(
      `${RENTAL_BASE_URL}/cleanings/${id}/cancel`,
      cashboxId ? { cashboxId } : {},
    );
    return response.data;
  },
};
