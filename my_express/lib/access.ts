import type { User } from '../types/api';

/**
 * Penentu akses fitur yang sifatnya khusus pemilik toko (tab Laporan, tab
 * Hutang) — SATU-SATUNYA tempat keputusan itu dibuat, supaya layar cukup
 * memanggil satu fungsi dan tidak menggali sendiri dari bentuk data user.
 *
 * TODO(peran): model `users` saat ini tidak punya kolom peran, dan JWT hanya
 * membawa `userId` (lihat `my_express_api/src/middleware/auth.ts`), sehingga
 * belum ada dasar untuk membedakan pemilik toko dari kasir. Karena itu fungsi
 * ini sementara selalu mengembalikan `true`.
 *
 * PENTING: menyembunyikan tab lewat fungsi ini BELUM membatasi data — endpoint
 * laporan di backend tetap terbuka untuk semua pemilik token. Pembatasan sejati
 * (termasuk HTTP 403 untuk peran kasir) menunggu keputusan soal sistem peran
 * dan sengaja TIDAK dibuat sendiri di sini.
 */
export function canViewReports(_user: User | null): boolean {
  return true;
}
