import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import type { HistoryFilter } from '../../features/history/api';
import { useHistory } from '../../features/history/queries';
import { withoutTransfer } from '../../features/reports/incomeData';
import { TabHeaderTitle } from '../../features/tabs/TabHeaderTitle';
import { getErrorMessage } from '../../lib/api';
import { formatClock, formatDayLabel } from '../../lib/date';
import { formatRupiah } from '../../lib/format';
import { PAYMENT_METHOD_LABEL } from '../../lib/receiptText';
import { colors, fontSize, fontWeight, home, navy, radius, spacing } from '../../lib/theme';
import type { HistoryDay, PaymentMethod, TransactionSummary } from '../../types/api';

/**
 * Daftar riwayat lengkap yang dibuka dari tautan "Lihat semua" pada tab
 * Laporan. Layar ini sengaja berada DI LUAR grup tab, sehingga tampil tanpa
 * tab bar dan kontennya fokus ke satu daftar.
 *
 * Isinya tetap tata letak Riwayat lama (dikelompokkan per hari, total per
 * hari, ketuk satu baris untuk membuka struk), hanya dibatasi ke periode yang
 * sedang dipilih di tab Laporan dan tanpa transaksi bermetode transfer lama —
 * persis aturan yang dipakai kartu "Riwayat transaksi" di layar sebelumnya,
 * sehingga "Lihat semua" tidak pernah menampilkan baris yang kartunya sembunyikan.
 */

/** Pilihan filter metode bayar; null = tampilkan semua. */
type MethodFilter = PaymentMethod | null;

/** Metode yang dipakai pemilik toko. Transfer sengaja tidak ditawarkan lagi. */
const METHOD_FILTERS: { value: MethodFilter; label: string }[] = [
  { value: null, label: 'Semua' },
  { value: 'tunai', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
];

export default function LaporanRiwayatScreen() {
  const params = useLocalSearchParams<{ from?: string; to?: string; label?: string }>();
  const from = typeof params.from === 'string' && params.from ? params.from : undefined;
  const to = typeof params.to === 'string' && params.to ? params.to : undefined;
  const label = typeof params.label === 'string' && params.label ? params.label : undefined;

  const [method, setMethod] = useState<MethodFilter>(null);

  const filter = useMemo<HistoryFilter>(
    () => ({
      from,
      to,
      paymentMethod: method ?? undefined,
    }),
    [from, to, method],
  );

  const historyQuery = useHistory(filter);
  // Transaksi transfer lama dibuang di sini juga, agar daftarnya selaras
  // dengan kartu "Riwayat transaksi" di tab Laporan.
  const days = withoutTransfer(historyQuery.data ?? []);

  const grandTotal = days.reduce((sum, day) => sum + day.total, 0);
  const jumlahTransaksi = days.reduce((sum, day) => sum + day.count, 0);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTintColor: navy.main,
          headerTitle: () => (
            <TabHeaderTitle title="Riwayat transaksi" subtitle={`${jumlahTransaksi} transaksi`} />
          ),
        }}
      />

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
              <View style={styles.listHeader}>
                {label ? <Text style={styles.period}>{label}</Text> : null}
                <Text style={styles.grandTotal}>Total {formatRupiah(grandTotal)}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={48} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
              <Text style={styles.muted}>
                {method
                  ? 'Tidak ada transaksi dengan metode tersebut.'
                  : 'Transaksi akan muncul di sini setelah kasir berjualan.'}
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Lihat struk ${transaction.code}`}
      onPress={() => router.push(`/transaksi/${transaction.id}`)}
      style={({ pressed }) => [styles.txRow, pressed && styles.pressed]}
    >
      <View style={styles.txInfo}>
        <Text style={styles.txCode}>{transaction.code}</Text>
        <Text style={styles.txMeta}>
          {formatClock(transaction.createdAt)} · {PAYMENT_METHOD_LABEL[transaction.paymentMethod]}
        </Text>
      </View>
      <Text style={styles.txTotal}>{formatRupiah(transaction.total)}</Text>
    </Pressable>
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
  filters: { paddingTop: spacing.md, paddingBottom: spacing.xs },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  chipActive: {
    // Latar chip aktif kini gradasi; `overflow: hidden` memotongnya
    // mengikuti sudut membulat.
    borderColor: navy.main,
    overflow: 'hidden',
  },
  chipText: { fontSize: fontSize.caption, color: colors.textSecondary, fontWeight: fontWeight.semibold },
  chipTextActive: { color: colors.textInverse },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  listHeader: { gap: spacing.xs },
  period: { fontSize: fontSize.caption, color: colors.textMuted },
  grandTotal: { fontSize: fontSize.small, color: colors.textMuted, marginBottom: spacing.md },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  date: { flex: 1, fontSize: fontSize.body, fontWeight: fontWeight.bold, color: colors.text },
  dayTotal: { fontSize: fontSize.body, fontFamily: home.fontFamily.extraBold, color: navy.main },
  dayMeta: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: spacing.hair,
    marginBottom: spacing.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: spacing.md,
  },
  txInfo: { flex: 1 },
  txCode: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: colors.text },
  txMeta: { fontSize: fontSize.caption, color: colors.textMuted, marginTop: spacing.hair },
  txTotal: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: colors.text },
  pressed: { opacity: 0.7 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  muted: { fontSize: fontSize.small, color: colors.textMuted, textAlign: 'center' },
  errorText: { fontSize: fontSize.small, color: colors.danger, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: spacing.huge, gap: spacing.sm },
  emptyTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
});
