import { config as loadEnv } from 'dotenv';

// Pastikan file .env sudah dibaca sebelum variabel dipakai,
// apa pun urutan import modul ini.
loadEnv();

/**
 * Variabel lingkungan yang dipakai aplikasi.
 * Semua nilai dibaca dari file .env lewat dotenv.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} belum diisi di file .env`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  /**
   * Ping database berkala supaya mesin Neon tetap menyala.
   *
   * Layanan Postgres gratis (Neon) mematikan mesinnya sendiri setelah beberapa
   * menit tidak ada aktivitas, lalu menyalakannya lagi saat diminta — proses
   * yang butuh waktu dan kadang berakhir dengan "Authentication timed out".
   * Ping kecil tiap beberapa menit mencegah mesin itu tidur.
   *
   * HARGANYA: ping memakai kuota jam komputasi paket gratis. Matikan dengan
   * `KEEP_DATABASE_AWAKE=false` di .env bila tidak sedang butuh, misalnya
   * di luar jam demo.
   *
   * Nilai awal menyala, sebab aplikasi ini memang dipakai berdemonstrasi
   * dari perangkat lain dan koneksi yang mati di tengah demo tidak bisa
   * diperbaiki tanpa menyentuh laptop.
   */
  keepDatabaseAwake: process.env.KEEP_DATABASE_AWAKE !== 'false',
};
