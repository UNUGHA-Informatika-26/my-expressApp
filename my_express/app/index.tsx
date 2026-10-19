import { Redirect } from 'expo-router';

/**
 * Layar pembuka. Selalu menuju layar splash, yang menunggu sesi login selesai
 * dimuat sebelum memilih Beranda atau Login.
 *
 * Keputusan login sengaja TIDAK dibuat di sini: token disimpan di SecureStore
 * yang pembacaannya async, sehingga token masih null saat layar ini tampil.
 * Membaca token di sini akan melempar pengguna yang sudah login ke layar
 * Login. Lihat app/splash.tsx.
 */
export default function Index() {
  return <Redirect href="/splash" />;
}
