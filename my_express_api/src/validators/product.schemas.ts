import { z } from 'zod';

/**
 * Aturan input produk mengikuti 04-api.md dan 03-database.md:
 * barcode/name/category/satuan wajib, price > 0, stock >= 0, minStock >= 0.
 * `satuan` sengaja teks bebas; daftar umum hanya pilihan cepat di aplikasi.
 */
export const createProductSchema = z.object({
  barcode: z
    .string()
    .min(1, 'Barcode wajib diisi')
    .max(50, 'Barcode maksimal 50 karakter'),
  name: z
    .string()
    .min(1, 'Nama produk wajib diisi')
    .max(150, 'Nama produk maksimal 150 karakter'),
  category: z
    .string()
    .min(1, 'Kategori wajib diisi')
    .max(50, 'Kategori maksimal 50 karakter'),
  satuan: z
    .string()
    .min(1, 'Satuan wajib diisi')
    .max(20, 'Satuan maksimal 20 karakter'),
  price: z
    .number('Harga harus berupa angka')
    .int('Harga harus bilangan bulat')
    .positive('Harga harus lebih dari 0'),
  stock: z
    .number('Stok harus berupa angka')
    .int('Stok harus bilangan bulat')
    .min(0, 'Stok tidak boleh negatif'),
  minStock: z
    .number('Batas minimum harus berupa angka')
    .int('Batas minimum harus bilangan bulat')
    .min(0, 'Batas minimum tidak boleh negatif'),
});

/**
 * Update produk: semua field opsional, tapi jika diisi harus valid.
 * `stock` juga dipakai untuk barang masuk (lihat 04-api.md).
 */
export const updateProductSchema = z.object({
  barcode: z
    .string()
    .min(1, 'Barcode tidak boleh kosong')
    .max(50, 'Barcode maksimal 50 karakter')
    .optional(),
  name: z
    .string()
    .min(1, 'Nama produk tidak boleh kosong')
    .max(150, 'Nama produk maksimal 150 karakter')
    .optional(),
  category: z
    .string()
    .min(1, 'Kategori tidak boleh kosong')
    .max(50, 'Kategori maksimal 50 karakter')
    .optional(),
  satuan: z
    .string()
    .min(1, 'Satuan tidak boleh kosong')
    .max(20, 'Satuan maksimal 20 karakter')
    .optional(),
  price: z
    .number('Harga harus berupa angka')
    .int('Harga harus bilangan bulat')
    .positive('Harga harus lebih dari 0')
    .optional(),
  stock: z
    .number('Stok harus berupa angka')
    .int('Stok harus bilangan bulat')
    .min(0, 'Stok tidak boleh negatif')
    .optional(),
  minStock: z
    .number('Batas minimum harus berupa angka')
    .int('Batas minimum harus bilangan bulat')
    .min(0, 'Batas minimum tidak boleh negatif')
    .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
