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
};
