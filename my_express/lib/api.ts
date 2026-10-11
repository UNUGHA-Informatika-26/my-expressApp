import axios from 'axios';
import { useAuthStore } from '../store/auth';

/**
 * Instance axios untuk memanggil backend my_express_api.
 * Base URL diambil dari EXPO_PUBLIC_API_URL (lihat .env).
 */
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

// Sisipkan token login ke setiap request yang butuh autentikasi.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Pesan error yang enak ditampilkan ke pengguna. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.code === 'ECONNABORTED') {
      return 'Koneksi ke server terlalu lama. Coba lagi.';
    }
    if (!error.response) {
      return 'Tidak bisa terhubung ke server. Pastikan backend berjalan.';
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Terjadi kesalahan yang tidak diketahui.';
}

/** true jika server membalas 404 (dipakai: barcode belum terdaftar). */
export function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
