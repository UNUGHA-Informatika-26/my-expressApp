import { Tabs } from 'expo-router';
import { NotificationBell } from '../../features/notifications/NotificationBell';
import { useNotificationSync } from '../../features/notifications/useNotificationSync';
import { CustomTabBar } from '../../features/tabs/CustomTabBar';
import { navy, spacing } from '../../lib/theme';

/**
 * Navigasi tab utama: Beranda, Katalog, Kasir, Laporan, Hutang, Akun.
 * Tab Riwayat diganti Tab Laporan (Pemasukan + Stok) sesuai keputusan di
 * docs/PROGRESS.md; daftar riwayat lengkap pindah ke rute di luar grup tab
 * `app/laporan/riwayat.tsx` dan dibuka lewat tautan "Lihat semua".
 *
 * Layout ini hanya dirender setelah pengguna login, jadi tempat yang tepat
 * untuk menjalankan sinkronisasi notifikasi (Fase 8) tanpa memanggil API
 * dari layar login.
 *
 * Tab bar diganti dengan `CustomTabBar` karena desain beranda meminta latar
 * pil membulat di tab aktif — tab bar bawaan hanya bisa mengganti warna teks.
 * Ikon Feather diambil lewat properti bawaan tiap layar, sehingga layar
 * tidak perlu mengulang daftar ikonnya.
 */
export default function TabsLayout() {
  useNotificationSync();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        // Kotak header seragam navy utama untuk kelima tab yang memakainya
        // (Beranda memakai kepala sendiri, jadi tidak terpengaruh). Warna
        // judul dan subjudulnya disesuaikan di TabHeaderTitle supaya tetap
        // terbaca di atas latar navy ini.
        headerStyle: { backgroundColor: navy.main },
        // Ikon lonceng berangka tersedia di semua tab (konsep.md bagian 3).
        headerRight: () => <NotificationBell />,
        // Wadah headerRight bawaan hanya membawa margin area aman dan tidak
        // punya padding sama sekali, sehingga lonceng menempel ke tepi layar.
        // Opsi ini ditempatkan React Navigation paling akhir pada gaya wadah,
        // jadi nilainya menang dan murni menambah jarak — tanpa menimpa apa pun.
        headerRightContainerStyle: { paddingRight: spacing.lg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          // Beranda memakai kepala layar sendiri, sesuai desain baru.
          headerShown: false,
        }}
      />
      <Tabs.Screen name="katalog" options={{ title: 'Katalog' }} />
      <Tabs.Screen name="kasir" options={{ title: 'Kasir' }} />
      <Tabs.Screen name="laporan" options={{ title: 'Laporan' }} />
      <Tabs.Screen name="hutang" options={{ title: 'Hutang' }} />
      <Tabs.Screen name="akun" options={{ title: 'Akun' }} />
    </Tabs>
  );
}
