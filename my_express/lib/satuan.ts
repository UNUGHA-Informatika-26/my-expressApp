/**
 * Daftar satuan yang ditawarkan saat mengisi produk.
 *
 * Penting (lihat docs/03-database.md dan 04-api.md): kolom `satuan` bersifat
 * teks bebas maksimal 20 karakter dan TIDAK dipaksa server memakai salah satu
 * nilai di bawah. Daftar ini murni pilihan cepat supaya pemilik toko tidak
 * mengetik ulang satuan yang sama berulang kali.
 *
 * Satuan tidak pernah dikonversi. Produk dengan satuan "rim" selalu dijual
 * dalam rim; menjualnya per lembar berarti membuat produk terpisah dengan
 * barcode sendiri.
 */

/** Batas karakter; sama dengan aturan backend (docs/04-api.md). */
export const SATUAN_MAKSIMAL = 20;

/** Teks baris terakhir: mengizinkan satuan di luar daftar umum. */
export const LABEL_KETIK_SENDIRI = 'Ketik sendiri…';

/** Satuan umum barang dagangan, dipakai sebagai pilihan cepat. */
export const SATUAN_UMUM = [
  'pcs',
  'pack',
  'rim',
  'lembar',
  'lusin',
  'box',
  'set',
  'botol',
  'kg',
  'meter',
] as const;

/** Satuan umum sebagai array biasa, siap dipakai pemilih. */
export function daftarSatuan(): string[] {
  return [...SATUAN_UMUM];
}
