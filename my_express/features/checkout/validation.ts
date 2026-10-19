import { z } from 'zod';

/**
 * Aturan form pembayaran mengikuti backend (docs/04-api.md):
 * metode bayar wajib, uang diterima wajib hanya untuk tunai.
 * Item diambil langsung dari keranjang (sudah divalidasi waktu ditambahkan).
 */
export const paymentSchema = z
  .object({
    paymentMethod: z.enum(['tunai', 'qris'], {
      message: 'Metode bayar harus Tunai atau QRIS',
    }),
    /** Teks dari TextInput; dikirim sebagai angka setelah lolos validasi. */
    amountReceived: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod !== 'tunai') {
      return;
    }
    if (data.amountReceived == null || data.amountReceived.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['amountReceived'],
        message: 'Uang diterima wajib diisi untuk pembayaran tunai',
      });
      return;
    }
    if (!/^\d+$/.test(data.amountReceived.trim())) {
      ctx.addIssue({
        code: 'custom',
        path: ['amountReceived'],
        message: 'Uang diterima harus berupa angka',
      });
    }
  });

/** Nilai form pembayaran (semuanya teks karena berasal dari TextInput). */
export type PaymentFormValues = {
  paymentMethod: 'tunai' | 'qris';
  amountReceived: string;
};

/** Payload siap kirim ke backend setelah lolos validasi. */
export interface CheckoutPayload {
  paymentMethod: 'tunai' | 'qris';
  amountReceived?: number;
  items: { productId: string; quantity: number }[];
}
