import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { getErrorMessage } from '../../lib/api';
import { formatClock } from '../../lib/date';
import { formatRupiah } from '../../lib/format';
import { PAYMENT_METHOD_LABEL } from '../../lib/receiptText';
import { colors, fontSize, fontWeight, home, navy, radius, spacing } from '../../lib/theme';
import { useAuthStore } from '../../store/auth';
import type { TransactionSummary } from '../../types/api';
import { Chip } from './Chip';
import { DownloadActions } from './DownloadActions';
import { bagikanExcel, bagikanPdf, useDownloadReport } from './download';
import { PREVIEW_LIMIT, flattenDays, useIncome } from './incomeData';
import { buildIncomeHtml, buildIncomeWorkbook, type IncomeReportData } from './incomeReport';
import { PERIOD_CHIPS, resolvePeriod, type CustomDates, type PeriodKey } from './period';
import { makeReportMeta } from './reportMeta';

/**
 * Tab Pemasukan pada layar Laporan.
 *
 * Seluruh angka diambil dari server lewat `useIncome` — tidak ada total yang
 * dihitung dari keranjang atau state lokal — dan seluruhnya dihitung ulang
 * setiap kali periode berganti.
 */
export function IncomeTab() {
  const user = useAuthStore((state) => state.user);
  const [periodKey, setPeriodKey] = useState<PeriodKey>('7-hari');
  const [custom, setCustom] = useState<CustomDates>({ from: '', to: '' });

  const period = resolvePeriod(periodKey, custom);
  const income = useIncome(period.range);
  const { busy, download } = useDownloadReport();

  const storeName = user?.storeName ?? '';
  const printedBy = user?.name ?? '';

  /** Bahan laporan dibuat saat tombol ditekan, sehingga nomor & waktu cetak baru. */
  const reportData = (): IncomeReportData => ({
    storeName,
    totals: income.totals,
    transactions: flattenDays(income.days),
    meta: makeReportMeta('PMS', printedBy, period.label),
  });

  // Periode Kustom belum lengkap → laporan belum bisa disusun.
  const ready = period.range !== null;

  const onPdf = (): void => {
    void download('pdf', 'Gagal mengunduh laporan', () => bagikanPdf(buildIncomeHtml(reportData()), 'PMS'));
  };
  const onExcel = (): void => {
    void download('excel', 'Gagal mengunduh laporan', () => bagikanExcel(buildIncomeWorkbook(reportData()), 'PMS'));
  };

  const preview = flattenDays(income.days).slice(0, PREVIEW_LIMIT);

  return (
    <View style={styles.content}>
      {/* 1. Chip periode */}
      <View style={styles.chipRow}>
        {PERIOD_CHIPS.map((chip) => (
          <Chip
            key={chip.key}
            label={chip.label}
            active={periodKey === chip.key}
            onPress={() => setPeriodKey(chip.key)}
          />
        ))}
      </View>

      {periodKey === 'kustom' && (
        <View>
          <View style={styles.customRow}>
            <View style={styles.half}>
              <Input
                label="Tanggal mulai"
                value={custom.from}
                onChangeText={(value) => setCustom((prev) => ({ ...prev, from: value }))}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                containerStyle={styles.field}
              />
            </View>
            <View style={styles.half}>
              <Input
                label="Tanggal selesai"
                value={custom.to}
                onChangeText={(value) => setCustom((prev) => ({ ...prev, to: value }))}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                containerStyle={styles.field}
              />
            </View>
          </View>
          {period.error ? <Text style={styles.error}>{period.error}</Text> : null}
        </View>
      )}

      {/* 2. Kartu ringkasan gradasi navy */}
      <LinearGradient
        colors={[navy.main, navy.dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.summary, home.shadow]}
      >
        <Text style={styles.summaryLabel}>Total pemasukan</Text>
        <Text style={styles.summaryAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {formatRupiah(income.totals.total)}
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>Jumlah transaksi</Text>
            <Text style={styles.summaryCellValue}>{income.totals.count}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>Jumlah item terjual</Text>
            <Text style={styles.summaryCellValue}>
              {income.totals.itemsSold === null ? '—' : income.totals.itemsSold}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* 3. Dua kartu metode — jumlah keduanya selalu sama dengan total di atas. */}
      <View style={styles.pair}>
        <Card style={styles.half} spaced={false}>
          <Text style={styles.pairLabel}>Total Tunai</Text>
          <Text style={styles.pairValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatRupiah(income.totals.cash.total)}
          </Text>
          <Text style={styles.pairMeta}>{income.totals.cash.count} transaksi</Text>
        </Card>
        <Card style={styles.half} spaced={false}>
          <Text style={styles.pairLabel}>Total QRIS</Text>
          <Text style={styles.pairValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatRupiah(income.totals.qris.total)}
          </Text>
          <Text style={styles.pairMeta}>{income.totals.qris.count} transaksi</Text>
        </Card>
      </View>

      {income.isLoading ? (
        <Text style={styles.muted}>Memuat laporan...</Text>
      ) : income.isError ? (
        <View style={styles.errorBlock}>
          <Text style={styles.error}>{getErrorMessage(income.error)}</Text>
          <Button label="Coba lagi" onPress={income.refetch} />
        </View>
      ) : null}

      {/* 4. Unduh PDF dan Excel */}
      <Card>
        <DownloadActions busy={busy} onPdf={onPdf} onExcel={onExcel} disabled={!ready} />
      </Card>

      {/* 5. Kartu riwayat transaksi */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Riwayat transaksi</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lihat semua transaksi"
            hitSlop={8}
            onPress={() =>
              router.push({
                pathname: '/laporan/riwayat',
                params: {
                  from: period.range?.from ?? '',
                  to: period.range?.to ?? '',
                  label: period.label,
                },
              })
            }
          >
            <Text style={styles.link}>Lihat semua</Text>
          </Pressable>
        </View>

        {preview.length === 0 ? (
          <Text style={styles.muted}>
            {ready ? 'Belum ada transaksi pada periode ini.' : 'Lengkapi periode untuk menampilkan transaksi.'}
          </Text>
        ) : (
          preview.map((transaction, index) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              first={index === 0}
            />
          ))
        )}
      </Card>
    </View>
  );
}

/** Satu baris pada kartu riwayat: nomor, jam · metode, lalu nominalnya. */
function TransactionRow({ transaction, first }: { transaction: TransactionSummary; first: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Lihat struk ${transaction.code}`}
      onPress={() => router.push(`/transaksi/${transaction.id}`)}
      style={({ pressed }) => [styles.txRow, !first && styles.txDivider, pressed && styles.pressed]}
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

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  customRow: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  /** Menetralkan `marginBottom` bawaan `Input`, karena sudah ada `gap`. */
  field: { marginBottom: spacing.none },
  error: { fontSize: fontSize.small, color: colors.danger },

  summary: {
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.caption,
    fontFamily: home.fontFamily.semibold,
    color: home.colors.onNavyMuted,
  },
  summaryAmount: {
    fontSize: fontSize.hero,
    fontFamily: home.fontFamily.extraBold,
    color: colors.textInverse,
    marginBottom: spacing.sm,
  },
  summaryRow: { flexDirection: 'row' },
  summaryCell: { flex: 1 },
  summaryCellLabel: {
    fontSize: fontSize.caption,
    fontFamily: home.fontFamily.semibold,
    color: home.colors.onNavyMuted,
    marginBottom: spacing.hair,
  },
  summaryCellValue: {
    fontSize: fontSize.title,
    fontFamily: home.fontFamily.bold,
    color: colors.textInverse,
  },

  pair: { flexDirection: 'row', gap: spacing.md },
  pairLabel: { fontSize: fontSize.caption, color: colors.textMuted, marginBottom: spacing.hair },
  pairValue: {
    fontSize: fontSize.title,
    fontFamily: home.fontFamily.bold,
    color: navy.dark,
    marginBottom: spacing.hair,
  },
  pairMeta: { fontSize: fontSize.caption, color: colors.textMuted },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: { fontSize: fontSize.body, fontWeight: fontWeight.bold, color: colors.text },
  link: { fontSize: fontSize.small, fontWeight: fontWeight.semibold, color: navy.main },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  txDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  txInfo: { flex: 1 },
  txCode: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: colors.text },
  txMeta: { fontSize: fontSize.caption, color: colors.textMuted, marginTop: spacing.hair },
  txTotal: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: colors.text },

  muted: { fontSize: fontSize.small, color: colors.textMuted },
  errorBlock: { gap: spacing.sm },
  pressed: { opacity: 0.7 },
});
