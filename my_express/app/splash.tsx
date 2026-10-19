import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../lib/theme';
import { useAuthStore } from '../store/auth';

/** Lamanya logo tampil sebelum aplikasi pindah layar. */
const DURASI_MS = 1500;

/**
 * Layar pembuka aplikasi (splash screen dalam aplikasi).
 *
 * Ini BUKAN splash screen native. Sejak SDK 52, Expo Go tidak pernah
 * menampilkan splash native — yang muncul justru ikon aplikasi. Layar ini
 * dipakai supaya logo tetap terlihat baik saat pengembangan maupun di APK.
 *
 * Nama aplikasi tidak ditulis terpisah karena sudah menempel di dalam
 * gambar logonya. Latarnya putih karena logonya juga berlatar putih, sehingga
 * kedua bidang menyatu dan tidak terlihat seperti kotak mengambang.
 */
export default function Splash() {
  const token = useAuthStore((state) => state.token);

  // Sesi login disimpan di SecureStore yang pembacaannya async, jadi token
  // masih null pada render pertama. Menunggu hydrasi mencegah pengguna yang
  // sudah login malah dilempar ke layar Login.
  const [tersedia, setTersedia] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (tersedia) {
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setTersedia(true));
  }, [tersedia]);

  useEffect(() => {
    if (!tersedia) {
      return;
    }

    // replace, bukan push: tombol kembali tidak boleh mengembalikan
    // pengguna ke layar splash.
    const timer = setTimeout(() => {
      router.replace(token ? '/(tabs)' : '/login');
    }, DURASI_MS);

    return () => clearTimeout(timer);
  }, [tersedia, token]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo-splash.jpeg')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Logo My Express"
      />

      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.footerText}>Menyiapkan aplikasi…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Gambar bersifat kotak, jadi tinggi dan lebarnya sama. */
  logo: { width: 280, height: 280 },
  footer: {
    position: 'absolute',
    bottom: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerText: { fontSize: fontSize.caption, color: colors.textMuted },
});
