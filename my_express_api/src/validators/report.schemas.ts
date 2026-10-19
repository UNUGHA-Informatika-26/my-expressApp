import { z } from 'zod';

/**
 * Query laporan transaksi (04-api.md bagian 7): `from` dan `to` berformat
 * `YYYY-MM-DD`, keduanya opsional.
 *
 * Berbeda dengan daftar riwayat, laporan tidak punya filter metode bayar —
 * pemilik toko butuh seluruh transaksi dalam rentang tanggal.
 *
 * Divalidasi di dalam controller, bukan middleware, karena `req.query`
 * Express 5 hanya bisa dibaca sehingga tidak bisa ditimpa hasil parse-nya
 * (alasan yang sama dengan `listTransactionsQuerySchema`).
 */
export const reportTransactionsQuerySchema = z
  .object({
    from: z
      .string('Format tanggal tidak valid')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .optional(),
    to: z
      .string('Format tanggal tidak valid')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && data.from > data.to) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'Tanggal akhir tidak boleh lebih awal dari tanggal mulai',
      });
    }
  });

export type ReportTransactionsQuery = z.infer<typeof reportTransactionsQuerySchema>;
