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
});
