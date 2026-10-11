import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { SalesChart } from '../../features/dashboard/SalesChart';
import { useDashboard } from '../../features/dashboard/queries';
import { StockBadge } from '../../features/catalog/StockBadge';
import { DebtWarning } from '../../features/debt/DebtWarning';
import { getErrorMessage } from '../../lib/api';
import { formatClock } from '../../lib/date';
import { formatRupiah } from '../../lib/format';
import type { DashboardSummary, TransactionSummary } from '../../types/api';

const METHOD_LABEL = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer' } as const;

export default function BerandaScreen() {
  const dashboardQuery = useDashboard();

  if (dashboardQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{getErrorMessage(dashboardQuery.error)}</Text>
        <Button label="Coba lagi" onPress={() => dashboardQuery.refetch()} />
      </View>
    );
  }

  // Guard `!data` sekaligus menutup status loading dan men-narrow tipe
  // menjadi DashboardSummary (isLoading/isError tidak men-narrow `data`).
  const data = dashboardQuery.data;
  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Memuat ringkasan...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SalesSummary data={data} />
      <DebtWarning dueDebts={data.dueDebts} />
      <ChartSection data={data} />
      <RestockSection data={data} />
      <RecentSection data={data} />
    </ScrollView>
  );
}

/** Penjualan hari ini beserta pembanding kemarin dan dua angka pendukung. */
function SalesSummary({ data }: { data: DashboardSummary }) {
  const delta = data.todaySales - data.yesterdaySales;

  return (
    <Card>
      <Text style={styles.label}>Penjualan hari ini</Text>
      <Text style={styles.bigNumber}>{formatRupiah(data.todaySales)}</Text>

      <View style={styles.compareRow}>
        <Text style={styles.compareLabel}>
          Kemarin {formatRupiah(data.yesterdaySales)}
        </Text>
        {delta !== 0 && (
          <Text style={[styles.delta, delta > 0 ? styles.deltaUp : styles.deltaDown]}>
            {delta > 0 ? '+' : ''}
            {formatRupiah(delta)}
          </Text>
        )}
      </View>

      <View style={styles.statsRow}>
        <StatBox icon="receipt-outline" value={String(data.transactionCount)} label="Transaksi" />
        <StatBox icon="cube-outline" value={String(data.itemsSold)} label="Barang terjual" />
      </View>
    </Card>
  );
}

function ChartSection({ data }: { data: DashboardSummary }) {
  return <SalesChart data={data.chart7Days} />;
}

/** Produk yang stoknya menipis atau habis, plus jalan pintas ke Katalog. */
function RestockSection({ data }: { data: DashboardSummary }) {
  return (
    <Card>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Stok perlu restok</Text>
        {data.lowStockCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{data.lowStockCount}</Text>
          </View>
        )}
      </View>

      {data.lowStockCount === 0 ? (
        <Text style={styles.mutedLeft}>Semua stok masih aman.</Text>
      ) : (
        <>
          {data.restockItems.map((item) => (
            <View key={item.id} style={styles.restockRow}>
              <View style={styles.restockInfo}>
                <Text style={styles.restockName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.restockMeta}>
                  Stok {item.stock} · min. {item.minStock}
                </Text>
              </View>
              <StockBadge status={item.stockStatus} />
            </View>
          ))}

          <View style={styles.sectionFooter}>
            <Button
              label="Lihat semua di Katalog"
              onPress={() => router.push('/(tabs)/katalog')}
            />
          </View>
        </>
      )}
    </Card>
  );
}

/** Lima transaksi terakhir. */
function RecentSection({ data }: { data: DashboardSummary }) {
  return (
    <Card>
      <Text style={styles.sectionTitle}>Transaksi terakhir</Text>

      {data.recentTransactions.length === 0 ? (
        <Text style={styles.mutedLeft}>Belum ada transaksi.</Text>
      ) : (
        data.recentTransactions.map((transaction) => (
          <RecentRow key={transaction.id} transaction={transaction} />
        ))
      )}
    </Card>
  );
}

function RecentRow({ transaction }: { transaction: TransactionSummary }) {
  return (
    <View style={styles.recentRow}>
      <View style={styles.restockInfo}>
        <Text style={styles.restockName}>{transaction.code}</Text>
        <Text style={styles.restockMeta}>
          {formatClock(transaction.createdAt)} · {METHOD_LABEL[transaction.paymentMethod]}
        </Text>
      </View>
      <Text style={styles.recentTotal}>{formatRupiah(transaction.total)}</Text>
    </View>
  );
}

function StatBox({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={18} color="#2563EB" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 32 },
  muted: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  mutedLeft: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  label: { fontSize: 14, color: '#6B7280' },
  bigNumber: { fontSize: 30, fontWeight: '800', color: '#111827', marginTop: 4 },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  compareLabel: { fontSize: 14, color: '#6B7280', flex: 1 },
  delta: { fontSize: 14, fontWeight: '700' },
  deltaUp: { color: '#059669' },
  deltaDown: { color: '#DC2626' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F9FAFB',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  restockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingVertical: 10,
    marginTop: 4,
  },
  restockInfo: { flex: 1 },
  restockName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  restockMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  sectionFooter: { marginTop: 12 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingVertical: 10,
    marginTop: 4,
  },
  recentTotal: { fontSize: 15, fontWeight: '700', color: '#111827' },
});
