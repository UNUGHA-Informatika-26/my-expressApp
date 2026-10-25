import { config as loadEnv } from 'dotenv';
import { Sequelize } from 'sequelize';

loadEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL belum diisi. Salin .env.example menjadi .env lalu isi nilainya.',
  );
}

/**
 * Layanan Postgres terkelola (Neon, Supabase, dsb.) mewajibkan koneksi SSL,
 * sedangkan Postgres yang dijalankan sendiri di mesin lokal umumnya tidak
 * memakainya. Karena itu SSL diikuti dari isi DATABASE_URL, bukan dipaksa
 * untuk semua kondisi — supaya kerja di mesin lokal tidak rusak.
 *
 * Nilai lain (disable/allow/prefer) sengaja tidak diikutkan.
 */
const needsSsl = /[?&]sslmode=(require|verify-ca|verify-full)\b/.test(databaseUrl);

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  // Semua perhitungan hari (hari ini, kemarin, grafik 7 hari) pakai WIB.
  timezone: '+07:00',
  logging: false,
  ...(needsSsl ? { dialectOptions: { ssl: { require: true } } } : {}),
  /**
   * Pengaturan kolam koneksi, disetel untuk Postgres TERKELOLA yang jauh
   * dari server (Neon di Singapore), bukan Postgres di mesin sendiri.
   *
   * - `acquire: 30 detik` — batas waktu mengambil koneksi. Bawaan Sequelize
   *   10 detik terlalu sempit: saat mesin Neon baru dinyalakan setelah tidur,
   *   membuka koneksi butuh waktu lebih lama, dan permintaan pengguna akan
   *   gagal padahal sebentar lagi pasti berhasil. Memberi waktu berarti
   *   pengguna menunggu sebentar, bukan melihat error.
   * - `idle: 30 detik` — koneksi yang menganggur ditutup setelah 30 detik.
   *   Nilai ini yang membuat kembali dari diam tidak membuka tumpukan
   *   koneksi lama yang kondisinya sudah tidak pasti.
   * - `min: 0` — sengaja dibiarkan nol supaya kolam benar-benar mengosongkan
   *   diri; menahan koneksi tetap terbuka justru memancing layanan kelolaan
   *   memutusnya secara sepihak.
   * - `max: 5` — cukup untuk aplikasi satu toko; menaikkannya tidak menambah
   *   kecepatan dan mendekatkan batas koneksi paket gratis.
   */
  pool: {
    max: 5,
    min: 0,
    idle: 30_000,
    acquire: 30_000,
  },
});
