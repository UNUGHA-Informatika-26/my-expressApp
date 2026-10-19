import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TabHeaderTitle } from '../../features/tabs/TabHeaderTitle';
import { IncomeTab } from '../../features/reports/IncomeTab';
import { SegmentedControl } from '../../features/reports/SegmentedControl';
import { StockTab } from '../../features/reports/StockTab';
import { canViewReports } from '../../lib/access';
import { colors, fontSize, fontWeight, navy, spacing } from '../../lib/theme';
import { useAuthStore } from '../../store/auth';

/** Isi tab yang sedang dipilih. */
type Segment = 'pemasukan' | 'stok';

const SEGMENTS = [
  { value: 'pemasukan', label: 'Pemasukan' },
  { value: 'stok', label: 'Stok' },
] as const;

/**
 * Tab Laporan — khusus pemilik toko.
 *
 * Layar ini hanya memegang kerangkanya: kepala layar, pengalih Pemasukan /
 * Stok, dan satu wadah gulir. Seluruh data, unduhan, dan keadaan memuat/
 * galat tinggal di dalam `IncomeTab` dan `StockTab` masing-masing, supaya
 * keduanya bisa diuji dan dirawat terpisah.
 */
export default function LaporanScreen() {
  const user = useAuthStore((state) => state.user);
  const [segment, setSegment] = useState<Segment>('pemasukan');

  const dapatMelihatLaporan = canViewReports(user);

  return (
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          headerTitle: () => <TabHeaderTitle title="Laporan" subtitle="Khusus pemilik toko" />,
        }}
      />

      {!dapatMelihatLaporan ? (
        <View style={styles.denied}>
          <Feather name="lock" size={32} color={colors.textFaint} />
          <Text style={styles.deniedTitle}>Laporan hanya untuk pemilik toko</Text>
          <Text style={styles.deniedText}>
            Akun ini tidak memiliki akses ke laporan pemasukan dan stok.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.switcher}>
            <SegmentedControl
              options={SEGMENTS}
              value={segment}
              onChange={setSegment}
            />
          </View>

          {/*
            Satu wadah gulir untuk kedua isi supaya pengalih dan kepala layar
            tetap terlihat saat daftarnya panjang. `keyboardShouldPersistTaps`
            dipakai isian tanggal periode Kustom: sekali ketuk tombol Unduh
            tidak perlu dua kali ketika papan ketik masih terbuka.
          */}
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {segment === 'pemasukan' ? <IncomeTab /> : <StockTab />}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: navy.background },
  switcher: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  /** Isi tab sudah membawa paddingnya sendiri, jadi wadah gulir cukup tumbuh. */
  scroll: { flexGrow: 1 },
  denied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  deniedTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  deniedText: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
