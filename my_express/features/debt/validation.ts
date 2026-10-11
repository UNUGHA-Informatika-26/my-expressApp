import { z } from 'zod';

/**
 * Aturan form hutang mengikuti backend (docs/04-api.md dan 03-database.md).
 *
 * Semua kolom angka dan tanggal diterima sebagai TEKS dari TextInput,
 * lalu dikonversi ke number/string siap kirim setelah lolos validasi —
 * cara yang sama seperti form pembayaran pada Fase 5.
 */

/** Tanggal `YYYY-MM-DD` yang benar-benar ada (menolak 2026-02-30). */
const tanggalWajib = z
  .string('Tanggal jatuh tempo wajib diisi')
  .trim()
  .min(1, 'Tanggal jatuh tempo wajib diisi')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Tanggal tidak valid');

/** Angka bulat positif yang diketik sebagai teks, contoh: "150000". */
const angkaPositif = (label: string) =>
  z
    .string(`${label} wajib diisi`)
    .trim()
    .min(1, `${label} wajib diisi`)
    .regex(/^\d+$/, `${label} harus berupa angka`)
    .refine((value) => Number(value) > 0, `${label} harus lebih dari 0`);

/** Form tambah hutang (layar /hutang/baru). */
export const debtFormSchema = z.object({
  /** Hasil pilihan pengguna; dibiarkan kosong sampai distributor dipilih. */
  distributorId: z.string().min(1, 'Distributor wajib dipilih'),
  invoiceNumber: z
    .string('Nomor faktur wajib diisi')
    .trim()
    .min(1, 'Nomor faktur wajib diisi')
    .max(50, 'Nomor faktur maksimal 50 karakter'),
  /** Teks dari TextInput; dikirim sebagai angka setelah lolos validasi. */
  totalAmount: angkaPositif('Total hutang'),
  dueDate: tanggalWajib,
});

export type DebtFormValues = {
  distributorId: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate: string;
};

/** Payload tambah hutang siap kirim (04-api.md). */
export interface CreateDebtPayload {
  distributorId: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
}

/** Form tambah distributor (muncul di layar yang sama dengan form hutang). */
export const distributorFormSchema = z.object({
  name: z
    .string('Nama distributor wajib diisi')
    .trim()
    .min(1, 'Nama distributor wajib diisi')
    .max(100, 'Nama distributor maksimal 100 karakter'),
  /** Dibiarkan kosong; backend menyimpannya sebagai null. */
  phone: z
    .string('Nomor telepon tidak valid')
    .trim()
    .max(20, 'Nomor telepon maksimal 20 karakter')
    .optional(),
});

export type DistributorFormValues = {
  name: string;
  phone: string;
};

/** Payload tambah distributor siap kirim. */
export interface CreateDistributorPayload {
  name: string;
  phone?: string;
}

/** Form bayar hutang (pada layar detail). */
export const paymentFormSchema = z.object({
  /** Teks dari TextInput; dikirim sebagai angka setelah lolos validasi. */
  amount: angkaPositif('Jumlah pembayaran'),
  note: z
    .string('Catatan tidak valid')
    .trim()
    .max(200, 'Catatan maksimal 200 karakter')
    .optional(),
});

export type PaymentFormValues = {
  amount: string;
  note: string;
};

/** Payload bayar hutang siap kirim (04-api.md). */
export interface PayDebtPayload {
  amount: number;
  note?: string;
}

/**
 * Bentuk hasil `safeParse` zod.
 * Ditulis struktural (bukan diimpor dari zod) karena nama tipe hasil safeParse
 * berbeda antar versi zod; dua helper di bawah hanya membaca `issues`,
 * jadi cukup dengan bentuk ini.
 */
export type SafeParseResultLike =
  | { success: true }
  | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };

/** Ambil error validasi per kolom; dipakai untuk menampilkan pesan di bawah kolom. */
export function fieldErrors(result: SafeParseResultLike): Record<string, string> {
  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join('.');
    // Tampilkan pesan pertama untuk tiap kolom.
    if (field && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
