import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StockBadge } from '../../features/catalog/StockBadge';
import { DebtWarning } from '../../features/debt/DebtWarning';
import { useDashboard } from '../../features/dashboard/queries';
import { NotificationBell } from '../../features/notifications/NotificationBell';
import { getErrorMessage } from '../../lib/api';
import { formatClock, formatHeadlineDate, formatWeekday } from '../../lib/date';
import { formatRupiah } from '../../lib/format';
import { home, navy, opacity, spacing } from '../../lib/theme';
import { useAuthStore } from '../../store/auth';
import type { DashboardSummary } from '../../types/api';

const METHOD_LABEL = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer' } as const;

/** Jumlah baris restok dan transaksi terakhir yang ditampilkan di beranda. */
const MAKS_BARIS = 3;

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
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header data={data} />
        <SalesCard data={data} />
        <StatRow data={data} />
        <StartTransactionButton />
        <DebtWarning dueDebts={data.dueDebts} />
        <RestockSection data={data} />
        <RecentSection data={data} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Kepala beranda: tanggal, sapaan, nama toko, dan lonceng. */
function Header({ data }: { data: DashboardSummary }) {
  // Nama dan nama toko diambil dari sesi login, sehingga ikut berubah
  // saat profil diedit di layar Akun.
  const name = useAuthStore((s) => s.user?.name);
  const storeName = useAuthStore((s) => s.user?.storeName);

  // Angka lonceng: seluruh peringatan stok dan hutang yang perlu diperhatikan.
  const peringatan =
    data.lowStockCount + data.dueDebts.overdueCount + data.dueDebts.dueIn7DaysCount;

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.date}>{formatHeadlineDate()}</Text>
        <Text style={styles.greeting}>{name ? `Halo, ${name} 👋` : 'Halo 👋'}</Text>
        {/* Nama toko tidak pernah diisi saat pendaftaran, jadi barisnya hanya
            dirender bila sudah diisi di layar Akun — supaya tidak menyisakan
            ruang kosong pada kepala. */}
        {storeName ? <Text style={styles.storeName}>{storeName}</Text> : null}
      </View>
      <NotificationBell count={peringatan} />
    </View>
  );
}

/** Kartu penjualan hari ini: angka besar, pil perbandingan, dan grafik 7 batang. */
function SalesCard({ data }: { data: DashboardSummary }) {
  const delta = data.todaySales - data.yesterdaySales;
  const persen =
    data.yesterdaySales > 0 ? (delta / data.yesterdaySales) * 100 : null;

  return (
    <LinearGradient
      colors={[navy.main, navy.dark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.salesCard}
    >
      <Text style={styles.salesLabel}>Penjualan hari ini</Text>
      <Text style={styles.salesAmount}>{formatRupiah(data.todaySales)}</Text>

      {persen !== null && delta !== 0 && (
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(persen).toFixed(1).replace('.', ',')}% dari
            kemarin
          </Text>
        </View>
      )}

      <SalesBars data={data} />
    </LinearGradient>
  );
}

/**
 * Grafik 7 batang rata bawah, dibuat dari View biasa sesuai desain.
 * Batang terakhir (hari ini) putih solid, sisanya putih transparan.
 */
function SalesBars({ data }: { data: DashboardSummary }) {
  const puncak = Math.max(...data.chart7Days.map((point) => point.total), 0);

  return (
    <View style={styles.chart}>
      {data.chart7Days.map((point, index) => {
        const terakhir = index === data.chart7Days.length - 1;
        // Nilai nol tetap diberi batang tipis agar hari itu terlihat ada.
        const tinggi =
          puncak > 0
            ? Math.max(home.spacing.barMinHeight, (point.total / puncak) * home.spacing.barMaxHeight)
            : home.spacing.barMinHeight;

        return (
          <View key={point.date} style={styles.column}>
            <View
              style={[
                styles.bar,
                {
                  height: tinggi,
                  backgroundColor: terakhir ? home.colors.surface : home.colors.onNavySoft,
                },
              ]}
            />
            <Text style={styles.dayLabel}>{formatWeekday(point.date).charAt(0)}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Tiga kartu statistik sejajar. */
function StatRow({ data }: { data: DashboardSummary }) {
  return (
    <View style={styles.statRow}>
      <StatCard value={data.transactionCount} label="Transaksi" />
      <StatCard value={data.itemsSold} label="Item terjual" />
      <StatCard value={data.lowStockCount} label="Stok menipis" />
    </View>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Tombol menuju layar Kasir. */
function StartTransactionButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Mulai transaksi baru"
      onPress={() => router.push('/(tabs)/kasir')}
      style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
    >
      <Text style={styles.ctaText}>Mulai transaksi baru</Text>
      <View style={styles.ctaCircle}>
        <Feather name="plus" size={20} color={navy.dark} />
      </View>
    </Pressable>
  );
}

/** Produk yang stoknya menipis atau habis, paling banyak tiga baris. */
function RestockSection({ data }: { data: DashboardSummary }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Perlu restok</Text>

      {data.lowStockCount === 0 ? (
        <Card style={styles.listCard} spaced={false}>
          <Text style={styles.empty}>Semua stok masih aman.</Text>
        </Card>
      ) : (
        <Card style={styles.listCard} spaced={false}>
          {data.restockItems.slice(0, MAKS_BARIS).map((item, index) => (
            <View
              key={item.id}
              style={[styles.row, index > 0 && styles.rowDivider]}
            >
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <StockBadge status={item.stockStatus} sisa={item.stock} />
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

/** Tiga transaksi terakhir beserta jalan pintas ke tab Laporan. */
function RecentSection({ data }: { data: DashboardSummary }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transaksi terakhir</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lihat semua transaksi"
          hitSlop={8}
          onPress={() => router.push('/(tabs)/laporan')}
        >
          <Text style={styles.link}>Lihat semua</Text>
        </Pressable>
      </View>

      <Card style={styles.listCard} spaced={false}>
        {data.recentTransactions.length === 0 ? (
          <Text style={styles.empty}>Belum ada transaksi.</Text>
        ) : (
          data.recentTransactions
            .slice(0, MAKS_BARIS)
            .map((transaction, index) => (
              <View
                key={transaction.id}
                style={[styles.row, index > 0 && styles.rowDivider]}
              >
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{transaction.code}</Text>
                  <Text style={styles.rowMeta}>
                    {formatClock(transaction.createdAt)} ·{' '}
                    {METHOD_LABEL[transaction.paymentMethod]}
                  </Text>
                </View>
                <Text style={styles.rowTotal}>
                  {formatRupiah(transaction.total)}
                </Text>
              </View>
            ))
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: navy.background },
  // Padding bawah ditambah agar konten terakhir tidak tertutup tab bar.
  content: {
    padding: home.spacing.screenPadding,
    paddingBottom: home.spacing.bottomPadding,
    gap: home.spacing.blockGap,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: home.spacing.screenPadding,
    gap: home.spacing.blockGap,
    backgroundColor: navy.background,
  },
  muted: {
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.body,
    color: navy.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.body,
    color: home.colors.habisText,
    textAlign: 'center',
  },

  // --- Kepala ---
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { flex: 1 },
  date: {
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.caption,
    color: navy.textSecondary,
  },
  greeting: {
    marginTop: home.spacing.dateGap,
    fontFamily: home.fontFamily.extraBold,
    fontSize: home.fontSize.greeting,
    color: navy.dark,
  },
  storeName: {
    marginTop: home.spacing.storeGap,
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.body,
    color: navy.textSecondary,
  },

  // --- Kartu penjualan ---
  salesCard: {
    borderRadius: home.radius.sales,
    padding: home.spacing.salesPadding,
    gap: home.spacing.salesGap,
    ...home.shadow,
  },
  salesLabel: {
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.caption,
    color: home.colors.onNavyMuted,
  },
  salesAmount: {
    fontFamily: home.fontFamily.extraBold,
    fontSize: home.fontSize.amount,
    color: home.colors.surface,
  },
  pill: {
    alignSelf: 'flex-start',
    marginTop: home.spacing.pillGap,
    height: home.spacing.pillHeight,
    paddingHorizontal: home.spacing.pillPadding,
    borderRadius: home.radius.pill,
    backgroundColor: home.colors.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontFamily: home.fontFamily.bold,
    fontSize: home.fontSize.micro,
    color: home.colors.surface,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: home.spacing.barGap,
    marginTop: home.spacing.chartGap,
  },
  column: { flex: 1, alignItems: 'center', gap: home.spacing.dayLabelGap },
  bar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  dayLabel: {
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.micro,
    color: home.colors.onNavyMuted,
  },

  // --- Kartu statistik ---
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: home.colors.surface,
    borderColor: navy.border,
    borderWidth: 1,
    borderRadius: home.radius.card,
    padding: home.spacing.statPadding,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: home.fontFamily.extraBold,
    fontSize: home.fontSize.stat,
    color: navy.dark,
  },
  statLabel: {
    marginTop: spacing.hair,
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.caption,
    color: navy.textSecondary,
    textAlign: 'center',
  },

  // --- Tombol transaksi ---
  cta: {
    height: home.spacing.ctaHeight,
    borderRadius: home.radius.cta,
    backgroundColor: navy.dark,
    paddingHorizontal: home.spacing.listPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaPressed: { opacity: opacity.pressed },
  ctaText: {
    fontFamily: home.fontFamily.bold,
    fontSize: home.fontSize.button,
    color: home.colors.surface,
  },
  ctaCircle: {
    width: home.spacing.ctaCircle,
    height: home.spacing.ctaCircle,
    borderRadius: home.spacing.ctaCircle / 2,
    backgroundColor: home.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Bagian daftar ---
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: {
    flex: 1,
    fontFamily: home.fontFamily.extraBold,
    fontSize: home.fontSize.section,
    color: navy.dark,
  },
  link: {
    fontFamily: home.fontFamily.bold,
    fontSize: home.fontSize.body,
    color: navy.main,
  },
  listCard: { padding: home.spacing.listPadding },
  row: {
    minHeight: home.spacing.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: navy.border,
  },
  rowInfo: { flex: 1 },
  rowTitle: {
    flex: 1,
    fontFamily: home.fontFamily.bold,
    fontSize: home.fontSize.row,
    color: navy.dark,
  },
  rowMeta: {
    marginTop: spacing.hair,
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.micro,
    color: navy.textSecondary,
  },
  rowTotal: {
    fontFamily: home.fontFamily.bold,
    fontSize: home.fontSize.row,
    color: navy.dark,
  },
  empty: {
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.body,
    color: navy.textSecondary,
  },
});
