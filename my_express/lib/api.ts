import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/auth';

/**
 * Menentukan alamat backend. Semua pemanggilan API memakai hasil dari
 * fungsi ini — tidak ada alamat yang ditulis langsung di file lain.
 *
 * Urutan:
 * 1. EXPO_PUBLIC_API_URL dari .env, bila diisi (diprioritaskan).
 * 2. IP dari hostUri Metro. Bagian sebelum tanda titik dua adalah IP
 *    laptop, jadi alamat ikut mengikuti tanpa perlu mengubah .env tiap
 *    kali IP laptop berganti.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) {
    return `http://${host}:3000`;
  }

  throw new Error(
    'Alamat backend belum bisa ditentukan. Isi EXPO_PUBLIC_API_URL di file .env.',
  );
}

/**
 * Instance axios untuk memanggil backend my_express_api.
 *
 * `timeout` 90 detik, bukan 15 seperti lazimnya, karena backend dipasang di
 * Render paket GRATIS yang menidurkan layanannya setelah 15 menit tidak ada
 * permintaan. Saat dibangunkan, Render butuh 30-60 detik sebelum sanggup
 * menjawab. Dengan batas 15 detik, request pertama PASTI gagal padahal
 * server sebentar lagi siap — pengguna melihat "Koneksi ke server terlalu
 * lama" dan mengira aplikasinya rusak.
 *
 * Nilai ini jaring pengaman, bukan hal yang biasa terasa: selama pemantik
 * mengetuk /health tiap beberapa menit, Render tidak pernah tidur dan
 * pengguna tidak pernah menunggu. 90 detik hanya dipakai saat Render kebetulan
 * tertidur, misalnya pemantiknya sendiri sedang mati.
 */
export const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 90_000,
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
