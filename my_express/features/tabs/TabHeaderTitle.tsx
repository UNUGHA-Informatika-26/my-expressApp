import { StyleSheet, Text, View } from 'react-native';
import { colors, home, spacing } from '../../lib/theme';

/**
 * Judul header tab bawaan: judul di atas, subjudul berisi data nyata di
 * bawahnya. Dipakai Katalog, Kasir, Riwayat, Hutang, dan Akun.
 *
 * Header bawaan React Navigation hanya memuat satu baris teks, sehingga
 * judul dan subjudul harus digabung di sini lewat `headerTitle`. Beranda
 * tidak memakai komponen ini karena punya kepala layar sendiri.
 */
export function TabHeaderTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </View>
  );
}

/**
 * Warna teks menyesuaikan kotak header berlatar `navy.main` yang diatur di
 * `app/(tabs)/_layout.tsx`: judul putih penuh, subjudul putih 72% lewat token
 * `home.colors.onNavyMuted` — token itu memang dibuat untuk label kecil di
 * atas gradasi navy, sehingga kedua warnanya tidak ditulis di berkas ini.
 */
const styles = StyleSheet.create({
  wrap: { gap: spacing.hair },
  title: {
    fontFamily: home.fontFamily.bold,
    fontSize: home.fontSize.section,
    color: colors.textInverse,
  },
  subtitle: {
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.caption,
    color: home.colors.onNavyMuted,
  },
});
