import { categoryApi } from '@/api/axios-instance';
import type { Category } from '@/models/product.model';

/** PATCH /category/subcategory/:id — an empty string clears a translation */
export interface UpdateSubcategoryPayload {
  name?: string;
  nameUz?: string;
  nameEn?: string;
}

/** GET /category/:storeId/categories — the store's direction(s) with their subcategories */
const getStoreCategories = async (storeId: string): Promise<Category[]> => {
  const response = await categoryApi.get<Category[]>(`/${storeId}/categories`);
  return response.data;
};

/** GET /category — every direction with its subcategories */
const getCategoryTree = async (): Promise<Category[]> => {
  const response = await categoryApi.get<Category[]>('/');
  return response.data;
};

/**
 * POST /category/subcategory — find or create a subcategory of a direction
 * (OWNER of the store, or ADMIN). An existing name in any language returns that category.
 */
const createSubcategory = async (body: { parentId: string; name: string }): Promise<Category> => {
  const response = await categoryApi.post<Category>('/subcategory', body);
  return response.data;
};

/** PATCH /category/subcategory/:id (ADMIN) */
const updateSubcategory = async (id: string, body: UpdateSubcategoryPayload): Promise<Category> => {
  const response = await categoryApi.patch<Category>(`/subcategory/${id}`, body);
  return response.data;
};

/** DELETE /category/subcategory/:id (ADMIN) — only a subcategory without products */
const deleteSubcategory = async (id: string): Promise<{ id: string }> => {
  const response = await categoryApi.delete<{ id: string }>(`/subcategory/${id}`);
  return response.data;
};

export const categoryService = {
  getStoreCategories,
  getCategoryTree,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
