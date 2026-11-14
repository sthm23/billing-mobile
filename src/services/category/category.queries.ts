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
import { categoryService, type UpdateSubcategoryPayload } from './category.service';

type ApiError = AxiosError<{ message?: string | string[] }>;

export const categoryQueryKeys = {
  all: () => ['category'] as const,
  store: (storeId: string | undefined) => [...categoryQueryKeys.all(), 'store', storeId] as const,
  tree: () => [...categoryQueryKeys.all(), 'tree'] as const,
};

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
