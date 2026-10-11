import { api } from '../../lib/api';
import type {
  CategoryListResponse,
  MessageResponse,
  Product,
  ProductListResponse,
  ProductResponse,
  StockStatus,
} from '../../types/api';
import type { ProductPayload } from './validation';

/** Filter opsional untuk GET /api/products (lihat 04-api.md). */
export interface ProductFilter {
  search?: string;
  category?: string;
  stock?: StockStatus;
}

/** GET /api/products — daftar produk milik pemilik toko yang sedang login. */
export async function listProducts(filter: ProductFilter = {}): Promise<Product[]> {
  const { data } = await api.get<ProductListResponse>('/api/products', {
    params: {
      search: filter.search || undefined,
      category: filter.category || undefined,
      stock: filter.stock || undefined,
    },
  });
  return data.data;
}

/** GET /api/products/categories — daftar kategori yang sudah dipakai. */
export async function listCategories(): Promise<string[]> {
  const { data } = await api.get<CategoryListResponse>('/api/products/categories');
  return data.data;
}

/** GET /api/products/:id — detail satu produk. */
export async function getProduct(id: string): Promise<Product> {
  const { data } = await api.get<ProductResponse>(`/api/products/${id}`);
  return data.data;
}

/**
 * GET /api/products/barcode/:barcode — cari lewat barcode.
 * Melempar error 404 jika barcode belum terdaftar (lihat 04-api.md).
 */
export async function getProductByBarcode(barcode: string): Promise<Product> {
  const { data } = await api.get<ProductResponse>(
    `/api/products/barcode/${encodeURIComponent(barcode)}`,
  );
  return data.data;
}

/** POST /api/products — buat produk baru; barcode ganda dibalas 409. */
export async function createProduct(payload: ProductPayload): Promise<Product> {
  const { data } = await api.post<ProductResponse>('/api/products', payload);
  return data.data;
}

/** PUT /api/products/:id — ubah data produk. */
export async function updateProduct(id: string, payload: ProductPayload): Promise<Product> {
  const { data } = await api.put<ProductResponse>(`/api/products/${id}`, payload);
  return data.data;
}

/** DELETE /api/products/:id — hapus produk. */
export async function deleteProduct(id: string): Promise<void> {
  await api.delete<MessageResponse>(`/api/products/${id}`);
}
