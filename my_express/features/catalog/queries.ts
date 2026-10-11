import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../../types/api';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listCategories,
  listProducts,
  updateProduct,
  type ProductFilter,
} from './api';
import type { ProductPayload } from './validation';

/** Ambil daftar produk sesuai filter. Data server dikelola TanStack Query, bukan Zustand. */
export function useProducts(filter: ProductFilter) {
  return useQuery({
    queryKey: ['products', filter],
    queryFn: () => listProducts(filter),
  });
}

/** Ambil daftar kategori yang sudah dipakai. */
export function useCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: listCategories,
  });
}

/** Ambil detail satu produk (dipakai layar ubah produk). */
export function useProduct(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled,
  });
}

/**
 * Buat/ubah/hapus produk: setelah sukses semua daftar produk di-refresh,
 * supaya tabel katalog dan kategori langsung menampilkan data terbaru.
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product-categories'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductPayload }) =>
      updateProduct(id, payload),
    onSuccess: async (data: Product) => {
      queryClient.setQueryData(['product', data.id], data);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product-categories'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product-categories'] });
    },
  });
}
