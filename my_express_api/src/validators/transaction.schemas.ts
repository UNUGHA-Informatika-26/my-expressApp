import { z } from 'zod';

/**
 * Aturan checkout mengikuti 04-api.md:
 * paymentMethod wajib, amountReceived wajib hanya untuk tunai,
 * items minimal 1 dan quantity tiap item > 0.
 */
export const checkoutSchema = z
  .object({
    paymentMethod: z.enum(['tunai', 'qris', 'transfer'], {
      message: 'Metode bayar harus Tunai, QRIS, atau Transfer',
    }),
    amountReceived: z
      .number('Uang diterima harus berupa angka')
      .int('Uang diterima harus bilangan bulat')
      .min(0, 'Uang diterima tidak boleh negatif')
      .nullish(),
    items: z
      .array(
        z.object({
          productId: z.uuid('ID produk tidak valid'),
          quantity: z
            .number('Jumlah harus berupa angka')
            .int('Jumlah harus bilangan bulat')
            .positive('Jumlah minimal 1'),
        }),
      )
      .min(1, 'Keranjang masih kosong'),
  })
  .superRefine((data, ctx) => {
    // Uang diterima wajib untuk tunai, diabaikan untuk qris dan transfer.
    if (data.paymentMethod === 'tunai' && data.amountReceived == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['amountReceived'],
        message: 'Uang diterima wajib diisi untuk pembayaran tunai',
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * Query GET /transactions (04-api.md): `from`, `to` berformat YYYY-MM-DD,
 * `paymentMethod` salah satu dari tiga metode. Semuanya opsional.
 *
 * Di-validasi di dalam controller (bukan middleware) karena `req.query`
 * Express 5 hanya bisa dibaca, tidak bisa ditimpa seperti `req.body`.
 */
export const listTransactionsQuerySchema = z
  .object({
    from: z
      .string('Format tanggal tidak valid')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .optional(),
    to: z
      .string('Format tanggal tidak valid')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .optional(),
    paymentMethod: z
      .enum(['tunai', 'qris', 'transfer'], {
        message: 'Metode bayar harus Tunai, QRIS, atau Transfer',
      })
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

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
