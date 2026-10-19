import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { DebtCard } from '../../features/debt/DebtCard';
import { useDebts } from '../../features/debt/queries';
import { TabHeaderTitle } from '../../features/tabs/TabHeaderTitle';
import { getErrorMessage } from '../../lib/api';
import { formatRupiah } from '../../lib/format';
import { navy } from '../../lib/theme';
import type { DebtStatus, DebtSummary } from '../../types/api';

/** Pilihan filter status; null = tampilkan semua. */
type StatusFilter = DebtStatus | null;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: null, label: 'Semua' },
  { value: 'belum_lunas', label: 'Belum lunas' },
  { value: 'lunas', label: 'Lunas' },
];

/**
 * Layar Hutang Distributor (tugas Fase 7).
 * Menampilkan ringkasan total berjalan, lewat tempo, dan jatuh tempo 7 hari,
 * lalu daftar tagihan dengan progres pembayarannya.
 */
export default function HutangScreen() {
  const [status, setStatus] = useState<StatusFilter>(null);

  const debtsQuery = useDebts(status);
  const data = debtsQuery.data;
  const items = data?.items ?? [];
  const summary = data?.summary;

  return (
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          headerTitle: () => (
            <TabHeaderTitle
              title="Hutang"
              // `summary` dihitung dari SELURUH hutang yang belum lunas, jadi
              // angkanya tidak ikut berubah saat filter daftar diganti.
              subtitle={
                summary
                  ? `${formatRupiah(summary.totalOutstanding)} berjalan`
                  : 'Memuat ringkasan...'
              }
            />
          ),
        }}
      />
      <View style={styles.filters}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <Chip
              label={item.label}
              active={status === item.value}
              onPress={() => setStatus(item.value)}
            />
          )}
        />
      </View>

      {debtsQuery.isLoading ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Memuat hutang...</Text>
        </View>
      ) : debtsQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{getErrorMessage(debtsQuery.error)}</Text>
          <Button label="Coba lagi" onPress={() => debtsQuery.refetch()} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DebtCard debt={item} onPress={() => router.push(`/hutang/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          refreshing={debtsQuery.isRefetching}
          onRefresh={() => debtsQuery.refetch()}
          ListHeaderComponent={summary ? <SummaryCards summary={summary} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Belum ada hutang</Text>
              <Text style={styles.muted}>
                {status
                  ? 'Tidak ada hutang dengan status tersebut.'
                  : 'Tambahkan hutang distributor lewat tombol di bawah.'}
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <Button
          label="Tambah hutang"
          onPress={() => router.push('/hutang/baru')}
          disabled={debtsQuery.isError}
        />
      </View>
    </View>
  );
}

/** Tiga kartu ringkasan: total berjalan, lewat tempo, dan jatuh tempo 7 hari. */
function SummaryCards({ summary }: { summary: DebtSummary }) {
  return (
    <View style={styles.summaryRow}>
      <SummaryBox
        label="Total berjalan"
        value={formatRupiah(summary.totalOutstanding)}
        icon="wallet-outline"
        color={navy.main}
      />
      <SummaryBox
        label="Lewat tempo"
        value={formatRupiah(summary.overdueAmount)}
        icon="alert-circle-outline"
        color="#DC2626"
      />
      <SummaryBox
        label="≤ 7 hari"
        value={formatRupiah(summary.dueIn7DaysAmount)}
        icon="time-outline"
        color="#D97706"
      />
    </View>
  );
}

function SummaryBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={styles.summaryBox}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
    >
      {/* Gradasi hanya dipasang saat aktif; chip nonaktif tetap berlatar putih. */}
      {active && (
        <LinearGradient
          colors={[navy.main, navy.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: navy.background },
  filters: { paddingTop: 12, paddingBottom: 4 },
  chipRow: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    // Latar chip aktif kini gradasi; `overflow: hidden` memotongnya
    // mengikuti sudut membulat.
    borderColor: navy.main,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.7 },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 24 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: { fontSize: 14, fontWeight: '800', color: '#111827' },
  summaryLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  muted: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 4 },
  footer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
});
