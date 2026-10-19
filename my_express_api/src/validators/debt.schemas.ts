import { z } from 'zod';

/**
 * Aturan form mengikuti backend (04-api.md dan 03-database.md).
 * Field angka memakai number karena body JSON sudah berupa angka;
 * konversi dari teks TextInput dilakukan di aplikasi sebelum dikirim.
 */

/** Tanggal `YYYY-MM-DD` yang benar-benar ada (menolak 2026-02-30). */
const dateOnly = z
  .string('Tanggal wajib diisi')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Tanggal tidak valid');

/** POST /api/distributors */
export const createDistributorSchema = z.object({
  name: z
    .string('Nama distributor wajib diisi')
    .trim()
    .min(1, 'Nama distributor wajib diisi')
    .max(100, 'Nama distributor maksimal 100 karakter'),
  phone: z
    .string('Nomor telepon tidak valid')
    .trim()
    .max(20, 'Nomor telepon maksimal 20 karakter')
    .nullish(),
});

export type CreateDistributorInput = z.infer<typeof createDistributorSchema>;

/** POST /api/debts */
export const createDebtSchema = z.object({
  distributorId: z.uuid('Distributor tidak valid'),
  invoiceNumber: z
    .string('Nomor faktur wajib diisi')
    .trim()
    .min(1, 'Nomor faktur wajib diisi')
    .max(50, 'Nomor faktur maksimal 50 karakter'),
  totalAmount: z
    .number('Total hutang harus berupa angka')
    .int('Total hutang harus bilangan bulat')
    .positive('Total hutang harus lebih dari 0'),
  dueDate: dateOnly,
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;

/** POST /api/debts/:id/payments */
export const createPaymentSchema = z.object({
  amount: z
    .number('Jumlah pembayaran harus berupa angka')
    .int('Jumlah pembayaran harus bilangan bulat')
    .positive('Jumlah pembayaran harus lebih dari 0'),
  note: z
    .string('Catatan tidak valid')
    .trim()
    .max(200, 'Catatan maksimal 200 karakter')
    .nullish(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

/** GET /api/debts?status= */
export const listDebtsQuerySchema = z.object({
  status: z
    .enum(['belum_lunas', 'lunas'], {
      message: 'Status harus belum_lunas atau lunas',
    })
    .optional(),
});

export type ListDebtsQuery = z.infer<typeof listDebtsQuerySchema>;
