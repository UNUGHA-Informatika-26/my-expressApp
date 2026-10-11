import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { colors } from '../../lib/theme';
import { formatRupiah } from '../../lib/format';
import type { DueDebts } from '../../types/api';

/**
 * Peringatan hutang jatuh tempo di beranda (tugas Fase 7).
 *
 * Tampil hanya bila ada hutang lewat tempo atau jatuh tempo dalam 7 hari;
 * selain itu mengembalikan null agar beranda tidak menampilkan kartu kosong.
 */
export function DebtWarning({ dueDebts }: { dueDebts: DueDebts }) {
  const { overdueCount, overdueAmount, dueIn7DaysCount, dueIn7DaysAmount } = dueDebts;

  if (overdueCount === 0 && dueIn7DaysCount === 0) {
    return null;
  }

  return (
    <Card
      onPress={() => router.push('/(tabs)/hutang')}
      accessibilityLabel="Buka tab Hutang distributor"
      style={styles.alertBorder}
    >
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={18} color="#DC2626" />
        <Text style={styles.title}>Hutang distributor</Text>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>

      {overdueCount > 0 && (
        <View style={styles.row}>
          <View style={[styles.dot, styles.dotOverdue]} />
          <Text style={styles.rowText}>
            <Text style={styles.rowStrong}>{overdueCount} hutang lewat tempo</Text>
            {' — '}
            {formatRupiah(overdueAmount)}
          </Text>
        </View>
      )}

      {dueIn7DaysCount > 0 && (
        <View style={styles.row}>
          <View style={[styles.dot, styles.dotSoon]} />
          <Text style={styles.rowText}>
            <Text style={styles.rowStrong}>{dueIn7DaysCount} hutang jatuh tempo 7 hari</Text>
            {' — '}
            {formatRupiah(dueIn7DaysAmount)}
          </Text>
        </View>
      )}

      <Text style={styles.link}>Lihat detail di tab Hutang</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  /** Kartu peringatan tetap putih bergaris merah — perannya "peringatan",
   *  berbeda dari kartu status yang latarnya ikut berwarna. */
  alertBorder: { borderColor: colors.dangerBorder },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOverdue: { backgroundColor: '#DC2626' },
  dotSoon: { backgroundColor: '#D97706' },
  rowText: { flex: 1, fontSize: 13, color: '#374151' },
  rowStrong: { fontWeight: '700', color: '#111827' },
  link: { fontSize: 12, fontWeight: '600', color: '#2563EB', marginTop: 10 },
});
