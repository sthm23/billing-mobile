import type { Category } from '@/models/product.model';
import { adminStoreQueryKeys } from '@/services/admin-store/admin-store.queries';
import { productQueryKeys } from '@/services/product/product.queries';
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  catalogService,
  categoryService,
  type AttributeValueItem,
  type StoreAttribute,
  type StoreBrand,
  type TagGroup,
  type UpdateSubcategoryPayload,
} from './category.service';

type ApiError = AxiosError<{ message?: string | string[] }>;

export const categoryQueryKeys = {
  all: () => ['category'] as const,
  store: (storeId: string | undefined) => [...categoryQueryKeys.all(), 'store', storeId] as const,
  tree: () => [...categoryQueryKeys.all(), 'tree'] as const,
  brands: (storeId: string | undefined) => [...categoryQueryKeys.all(), 'brands', storeId] as const,
  attributes: (storeId: string | undefined) => [...categoryQueryKeys.all(), 'attributes', storeId] as const,
  tags: () => [...categoryQueryKeys.all(), 'tags'] as const,
  attributeValues: (attributeIds: string[]) =>
    [...categoryQueryKeys.all(), 'attributeValues', [...attributeIds].sort().join(',')] as const,
};

/** Values of the product's attributes (step 2 value chips). */
export const useAttributeValues = (attributeIds: string[], enabled = true): UseQueryResult<AttributeValueItem[]> =>
  useQuery({
    queryKey: categoryQueryKeys.attributeValues(attributeIds),
    queryFn: () => catalogService.getAttributeValues(attributeIds),
    enabled: enabled && attributeIds.length > 0,
    staleTime: 5 * 60_000,
  });

/** Find or create an attribute value; refreshes the value lists. */
export const useCreateAttributeValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogService.createAttributeValue,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...categoryQueryKeys.all(), 'attributeValues'] });
    },
  });
};

/** Brands of the store (product form). */
export const useStoreBrands = (storeId: string | undefined): UseQueryResult<StoreBrand[]> =>
  useQuery({
    queryKey: categoryQueryKeys.brands(storeId),
    queryFn: () => catalogService.getStoreBrands(storeId!),
    enabled: Boolean(storeId),
    staleTime: 10 * 60_000,
  });

/** Attributes of the store (product form attribute chips). */
export const useStoreAttributes = (storeId: string | undefined): UseQueryResult<StoreAttribute[]> =>
  useQuery({
    queryKey: categoryQueryKeys.attributes(storeId),
    queryFn: () => catalogService.getStoreAttributes(storeId!),
    enabled: Boolean(storeId),
    staleTime: 10 * 60_000,
  });

/** Tag groups with values (product form tag chips). */
export const useTags = (enabled = true): UseQueryResult<TagGroup[]> =>
  useQuery({
    queryKey: categoryQueryKeys.tags(),
    queryFn: catalogService.getTags,
    enabled,
    staleTime: 10 * 60_000,
  });

/** The store's direction(s) with subcategories: filter chips, category picker. */
export const useStoreCategories = (storeId: string | undefined): UseQueryResult<Category[]> =>
  useQuery({
    queryKey: categoryQueryKeys.store(storeId),
    queryFn: () => categoryService.getStoreCategories(storeId!),
    enabled: Boolean(storeId),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

/** Every direction with subcategories (admin store card). */
export const useCategoryTree = (enabled = true): UseQueryResult<Category[]> =>
  useQuery({
    queryKey: categoryQueryKeys.tree(),
    queryFn: categoryService.getCategoryTree,
    enabled,
    staleTime: 5 * 60_000,
  });

function invalidateCategories(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all() });
  void queryClient.invalidateQueries({ queryKey: adminStoreQueryKeys.catalog('categories') });
}

/** Find or create a subcategory; returns the existing one when the name is taken. */
export const useCreateSubcategory = (): UseMutationResult<Category, ApiError, { parentId: string; name: string }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryService.createSubcategory,
    onSuccess: () => invalidateCategories(queryClient),
  });
};

/** Rename / translate a subcategory (ADMIN). Products show the new name. */
export const useUpdateSubcategory = (): UseMutationResult<
  Category,
  ApiError,
  { id: string } & UpdateSubcategoryPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }) => categoryService.updateSubcategory(id, body),
    onSuccess: () => {
      invalidateCategories(queryClient);
      void queryClient.invalidateQueries({ queryKey: productQueryKeys.all() });
    },
  });
};

/** Delete a subcategory without products (ADMIN). */
export const useDeleteSubcategory = (): UseMutationResult<{ id: string }, ApiError, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryService.deleteSubcategory,
    onSuccess: () => invalidateCategories(queryClient),
  });
};
