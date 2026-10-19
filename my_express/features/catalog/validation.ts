import { z } from 'zod';

/**
 * Aturan form produk mengikuti backend (docs/04-api.md dan 03-database.md):
 * barcode/name/category/satuan wajib, price > 0, stock >= 0, minStock >= 0.
 * Field angka memakai coerce karena nilai dari TextInput selalu berupa teks.
 */
export const productFormSchema = z.object({
  barcode: z.string().trim().min(1, 'Barcode wajib diisi').max(50, 'Barcode maksimal 50 karakter'),
  name: z.string().trim().min(1, 'Nama produk wajib diisi').max(150, 'Nama produk maksimal 150 karakter'),
  category: z.string().trim().min(1, 'Kategori wajib diisi').max(50, 'Kategori maksimal 50 karakter'),
  satuan: z.string().trim().min(1, 'Satuan wajib dipilih').max(20, 'Satuan maksimal 20 karakter'),
  price: z.coerce
    .number('Harga harus berupa angka')
    .int('Harga harus bilangan bulat')
    .positive('Harga harus lebih dari 0'),
  stock: z.coerce
    .number('Stok harus berupa angka')
    .int('Stok harus bilangan bulat')
    .min(0, 'Stok tidak boleh negatif'),
  minStock: z.coerce
    .number('Batas minimum harus berupa angka')
    .int('Batas minimum harus bilangan bulat')
    .min(0, 'Batas minimum tidak boleh negatif'),
});

/**
 * Nilai form: semuanya teks karena berasal dari TextInput.
 * Saat validasi lolos, hasilnya berubah jadi ProductPayload (angka).
 */
export type ProductFormValues = {
  barcode: string;
  name: string;
  category: string;
  satuan: string;
  price: string;
  stock: string;
  minStock: string;
};

/** Payload siap kirim ke backend setelah lolos validasi. */
export type ProductPayload = z.output<typeof productFormSchema>;
