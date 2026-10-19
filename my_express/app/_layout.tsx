import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { auth } from '../lib/theme';

/**
 * Client TanStack Query.
 * Server state (produk, transaksi, hutang, dashboard) dikelola di sini,
 * bukan di Zustand — sesuai AGENTS.md.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const [client] = useState(() => queryClient);

  // Plus Jakarta Sans dipakai layar daftar-masuk. Dimuat di sini sekali untuk
  // seluruh aplikasi, dengan nama keluarga yang sama seperti di `theme.auth`,
  // sehingga layar cukup menyebut `fontFamily` tanpa memuat ulang.
  const [hurufSiap, hurufGagal] = useFonts({
    [auth.fontFamily.regular]: PlusJakartaSans_400Regular,
    [auth.fontFamily.medium]: PlusJakartaSans_500Medium,
    [auth.fontFamily.semibold]: PlusJakartaSans_600SemiBold,
    [auth.fontFamily.bold]: PlusJakartaSans_700Bold,
    [auth.fontFamily.extraBold]: PlusJakartaSans_800ExtraBold,
  });

  // Tahan tampilan sampai huruf selesai dimuat, agar tidak ada kilatan huruf
  // bawaan sistem sebelum Plus Jakarta Sans tampil. Bila huruf gagal dimuat,
  // tampilan tidak ditahan selamanya — layar tetap terbuka dengan huruf sistem.
  if (!hurufSiap && !hurufGagal) {
    return null;
  }

  return (
    <QueryClientProvider client={client}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
