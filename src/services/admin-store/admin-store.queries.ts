import {
  keepPreviousData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { adminStoreService } from './admin-store.service';
import type {
  AdminStoreDetails,
  AdminStoreListParams,
  AdminStoreListResponse,
  AdminStoreStaffItem,
  CatalogAttribute,
  CatalogBrand,
  CatalogCategory,
  CreateAdminStorePayload,
  NewStoreAttribute,
  StoreCatalogKind,
  StoreSuspendReason,
  UpdateAdminStorePayload,
} from './admin-store.types';

/** Page size of the store list (design: «Загружаем ещё 10») */
export const ADMIN_STORES_PAGE_SIZE = 10;

export const adminStoreQueryKeys = {
  all: () => ['adminStores'] as const,
  lists: () => [...adminStoreQueryKeys.all(), 'list'] as const,
  list: (params: Omit<AdminStoreListParams, 'currentPage'>) =>
    [...adminStoreQueryKeys.lists(), params] as const,
  byId: (id: string) => [...adminStoreQueryKeys.all(), 'byId', id] as const,
  staff: (id: string) => [...adminStoreQueryKeys.all(), 'staff', id] as const,
  catalog: (kind: 'categories' | 'brands' | 'attributes') => [...adminStoreQueryKeys.all(), 'catalog', kind] as const,
  dictionary: (kind: StoreCatalogKind, search: string) =>
    [...adminStoreQueryKeys.all(), 'dictionary', kind, search] as const,
};

/** Store list pages (search / filters from the backend). */
export const useAdminStoresInfinite = (
  params: Omit<AdminStoreListParams, 'currentPage' | 'pageSize'>,
  enabled = true,
) =>
  useInfiniteQuery({
    enabled,
    queryKey: adminStoreQueryKeys.list(params),
    queryFn: ({ pageParam }) =>
      adminStoreService.getStores({ ...params, pageSize: ADMIN_STORES_PAGE_SIZE, currentPage: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last: AdminStoreListResponse) =>
      last.currentPage * last.pageSize < last.total ? Number(last.currentPage) + 1 : undefined,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

/** Counts only (Profile entry «Магазины · N») */
export const useAdminStoreCounts = (enabled: boolean): UseQueryResult<AdminStoreListResponse> =>
  useQuery({
    enabled,
    queryKey: [...adminStoreQueryKeys.lists(), 'counts'] as const,
    queryFn: () => adminStoreService.getStores({ pageSize: 5, currentPage: 1 }),
    refetchOnWindowFocus: false,
  });

export const useAdminStore = (id: string | undefined): UseQueryResult<AdminStoreDetails> =>
  useQuery({
    enabled: Boolean(id),
    queryKey: adminStoreQueryKeys.byId(id ?? ''),
    queryFn: () => adminStoreService.getStore(id as string),
    refetchOnWindowFocus: false,
  });

export const useAdminStoreStaff = (id: string | undefined): UseQueryResult<AdminStoreStaffItem[]> =>
  useQuery({
    enabled: Boolean(id),
    queryKey: adminStoreQueryKeys.staff(id ?? ''),
    queryFn: () => adminStoreService.getStaff(id as string),
    refetchOnWindowFocus: false,
  });

/** Stores the returned card and refreshes the lists (counts change). */
function useStoreMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<AdminStoreDetails>,
  extraOnSuccess?: (queryClient: QueryClient) => unknown,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (store) => {
      queryClient.setQueryData(adminStoreQueryKeys.byId(store.id), store);
      void queryClient.invalidateQueries({ queryKey: adminStoreQueryKeys.lists() });
      void extraOnSuccess?.(queryClient);
    },
  });
}

export const useCreateAdminStore = () =>
  useStoreMutation(
    (payload: CreateAdminStorePayload) => adminStoreService.createStore(payload),
    // New brands / attributes may have been created
    (queryClient) => queryClient.invalidateQueries({ queryKey: [...adminStoreQueryKeys.all(), 'catalog'] }),
  );

export const useUpdateAdminStore = () =>
  useStoreMutation(({ id, ...payload }: UpdateAdminStorePayload & { id: string }) =>
    adminStoreService.updateStore(id, payload),
  );

export const useSuspendStore = () =>
  useStoreMutation(({ id, ...payload }: { id: string; reason: StoreSuspendReason; comment?: string }) =>
    adminStoreService.suspendStore(id, payload),
  );

export const useResumeStore = () =>
  useStoreMutation(({ id, ...payload }: { id: string; paidUntil?: string }) =>
    adminStoreService.resumeStore(id, payload),
  );

/** New warehouse of a store; reloads the card and the lists (warehouse counts) */
export const useCreateStoreWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, name }: { storeId: string; name: string }) =>
      adminStoreService.createWarehouse(storeId, name),
    onSuccess: (_, { storeId }) => {
      void queryClient.invalidateQueries({ queryKey: adminStoreQueryKeys.byId(storeId) });
      void queryClient.invalidateQueries({ queryKey: adminStoreQueryKeys.lists() });
    },
  });
};

/** Store directions for «Новый магазин» */
export const useRootCategories = (enabled = true): UseQueryResult<CatalogCategory[]> =>
  useQuery({
    enabled,
    queryKey: adminStoreQueryKeys.catalog('categories'),
    queryFn: async () => (await adminStoreService.getRootCategories()).filter((c) => !c.parentId),
    staleTime: 5 * 60_000,
  });

export const useAllBrands = (enabled = true): UseQueryResult<CatalogBrand[]> =>
  useQuery({
    enabled,
    queryKey: adminStoreQueryKeys.catalog('brands'),
    queryFn: adminStoreService.getBrands,
    staleTime: 5 * 60_000,
  });

export const useAllAttributes = (enabled = true): UseQueryResult<CatalogAttribute[]> =>
  useQuery({
    enabled,
    queryKey: adminStoreQueryKeys.catalog('attributes'),
    queryFn: adminStoreService.getAttributes,
    staleTime: 5 * 60_000,
  });

/** Brand / attribute dictionary of the store catalog editor (server search, most connected first) */
export const useCatalogDictionary = (kind: StoreCatalogKind, search: string, enabled = true) =>
  useQuery({
    enabled,
    queryKey: adminStoreQueryKeys.dictionary(kind, search),
    queryFn: () =>
      kind === 'brands' ? adminStoreService.searchBrands(search) : adminStoreService.searchAttributes(search),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

export type ConnectCatalogVars =
  | { kind: 'brands'; brandId: string }
  | { kind: 'brands'; name: string }
  | { kind: 'attributes'; attributeId: string }
  | { kind: 'attributes'; newAttribute: NewStoreAttribute };

/** Connect / disconnect one brand or attribute; reloads the store card and the dictionary (store counts) */
function useCatalogInvalidation(storeId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: adminStoreQueryKeys.byId(storeId) });
    void queryClient.invalidateQueries({ queryKey: [...adminStoreQueryKeys.all(), 'dictionary'] });
    // The create form lists every brand / attribute — a new one may have been created
    void queryClient.invalidateQueries({ queryKey: [...adminStoreQueryKeys.all(), 'catalog'] });
  };
}

export const useConnectCatalogItem = (storeId: string) => {
  const invalidate = useCatalogInvalidation(storeId);

  return useMutation({
    mutationFn: async (vars: ConnectCatalogVars): Promise<{ id: string; name: string }> => {
      const { kind, ...body } = vars;
      return kind === 'brands'
        ? adminStoreService.connectBrand(storeId, body as { brandId: string } | { name: string })
        : adminStoreService.connectAttribute(
            storeId,
            body as { attributeId: string } | { newAttribute: NewStoreAttribute },
          );
    },
    onSuccess: invalidate,
  });
};

export const useDisconnectCatalogItem = (storeId: string) => {
  const invalidate = useCatalogInvalidation(storeId);

  return useMutation({
    mutationFn: ({ kind, id }: { kind: StoreCatalogKind; id: string }) =>
      adminStoreService.disconnect(storeId, kind, id),
    onSuccess: invalidate,
  });
};
