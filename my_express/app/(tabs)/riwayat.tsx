import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import type { HistoryFilter } from '../../features/history/api';
import { useHistory } from '../../features/history/queries';
import { getErrorMessage } from '../../lib/api';
import { formatClock, formatDayLabel } from '../../lib/date';
import { formatRupiah } from '../../lib/format';
import type { HistoryDay, PaymentMethod, TransactionSummary } from '../../types/api';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  tunai: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
};

/** Pilihan filter metode bayar; null = tampilkan semua. */
type MethodFilter = PaymentMethod | null;

const METHOD_FILTERS: { value: MethodFilter; label: string }[] = [
  { value: null, label: 'Semua' },
  { value: 'tunai', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
  { value: 'transfer', label: 'Transfer' },
];

export default function RiwayatScreen() {
  const [method, setMethod] = useState<MethodFilter>(null);

  const filter = useMemo<HistoryFilter>(
    () => ({ paymentMethod: method ?? undefined }),
    [method],
  );

  const historyQuery = useHistory(filter);
  const days = historyQuery.data ?? [];

  const grandTotal = days.reduce((sum, day) => sum + day.total, 0);

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FlatList
          horizontal
          data={METHOD_FILTERS}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <Chip
              label={item.label}
              active={method === item.value}
              onPress={() => setMethod(item.value)}
            />
          )}
        />
      </View>

      {historyQuery.isLoading ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Memuat riwayat...</Text>
        </View>
      ) : historyQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{getErrorMessage(historyQuery.error)}</Text>
          <Button label="Coba lagi" onPress={() => historyQuery.refetch()} />
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => <DayCard day={item} />}
          contentContainerStyle={styles.list}
          refreshing={historyQuery.isRefetching}
          onRefresh={() => historyQuery.refetch()}
          ListHeaderComponent={
            days.length > 0 ? (
              <Text style={styles.grandTotal}>Total {formatRupiah(grandTotal)}</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
              <Text style={styles.muted}>
                {method ? 'Tidak ada transaksi dengan metode tersebut.' : 'Transaksi akan muncul di sini setelah kasir berjualan.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

/** Satu kartu hari berisi daftar transaksi pada hari itu. */
function DayCard({ day }: { day: HistoryDay }) {
  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{formatDayLabel(day.date)}</Text>
        <Text style={styles.dayTotal}>{formatRupiah(day.total)}</Text>
      </View>
      <Text style={styles.dayMeta}>{day.count} transaksi</Text>

      {day.transactions.map((transaction) => (
        <TransactionRow key={transaction.id} transaction={transaction} />
      ))}
    </Card>
  );
}

function TransactionRow({ transaction }: { transaction: TransactionSummary }) {
  return (
    <View style={styles.txRow}>
      <View style={styles.txInfo}>
        <Text style={styles.txCode}>{transaction.code}</Text>
        <Text style={styles.txMeta}>
          {formatClock(transaction.createdAt)} · {METHOD_LABEL[transaction.paymentMethod]}
        </Text>
      </View>
      <Text style={styles.txTotal}>{formatRupiah(transaction.total)}</Text>
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
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  pressed: { opacity: 0.7 },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 24 },
  grandTotal: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  date: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  dayTotal: { fontSize: 16, fontWeight: '800', color: '#2563EB' },
  dayMeta: { fontSize: 13, color: '#6B7280', marginTop: 2, marginBottom: 6 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingVertical: 10,
  },
  txInfo: { flex: 1 },
  txCode: { fontSize: 14, fontWeight: '700', color: '#111827' },
  txMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  txTotal: { fontSize: 15, fontWeight: '700', color: '#111827' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  muted: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 4 },
});
