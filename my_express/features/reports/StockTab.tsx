import dayjs from 'dayjs';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StockBadge } from '../catalog/StockBadge';
import { useProducts } from '../catalog/queries';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { getErrorMessage } from '../../lib/api';
import { formatShortDate } from '../../lib/date';
import {
  colors,
  fontSize,
  fontWeight,
  home,
  layout,
  navy,
  radius,
  report,
  spacing,
} from '../../lib/theme';
import { useAuthStore } from '../../store/auth';
import type { Product } from '../../types/api';
import { Chip } from './Chip';
import { DownloadActions } from './DownloadActions';
import { bagikanExcel, bagikanPdf, useDownloadReport } from './download';
import { makeReportMeta } from './reportMeta';
import {
  buildStockHtml,
  buildStockWorkbook,
  type StockReportData,
} from './stockReport';

/**
 * Tab Stok pada layar Laporan.
 *
 * Angka ringkasan (menipis dan habis) selalu dihitung atas SELURUH produk,
 * sehingga kedua kartu tidak pernah berubah isi saat chip filter diganti.
 * Chip hanya menyaring daftar "Perlu restok" di bawahnya — dan daftar yang
 * sama pula yang ikut ke PDF dan Excel, supaya file selalu identik dengan layar.
 */

type FilterKey = 'semua' | 'menipis' | 'habis';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'menipis', label: 'Menipis' },
  { key: 'habis', label: 'Habis' },
];

/** Dua huruf depan nama produk untuk bulatan di kiri tiap baris. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter((word) => word.length > 0);
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

/** Bandingkan stok dari yang terkecil — ketentuan urutan kartu "Perlu restok". */
function byStockAsc(a: Product, b: Product): number {
  return a.stock - b.stock;
}

export function StockTab() {
  const user = useAuthStore((state) => state.user);
  const [filter, setFilter] = useState<FilterKey>('semua');

  const productsQuery = useProducts({});
  const { busy, download } = useDownloadReport();

  const products = productsQuery.data ?? [];
  const menipis = products.filter((product) => product.stockStatus === 'menipis');
  const habis = products.filter((product) => product.stockStatus === 'habis');
  /** Semua produk yang perlu restok: menipis digabung habis, stok terkecil di atas. */
  const perluRestok = [...menipis, ...habis].sort(byStockAsc);

  const counts: Record<FilterKey, number> = {
    semua: perluRestok.length,
    menipis: menipis.length,
    habis: habis.length,
  };

  const visible =
    filter === 'semua' ? perluRestok : perluRestok.filter((product) => product.stockStatus === filter);

  const storeName = user?.storeName ?? '';
  const printedBy = user?.name ?? '';
  const tanggal = formatShortDate(dayjs().format('YYYY-MM-DD'));

  const reportData = (): StockReportData => ({
    storeName,
    products: visible,
    menipisCount: menipis.length,
    habisCount: habis.length,
    meta: makeReportMeta('STK', printedBy, tanggal),
  });

  const onPdf = (): void => {
    void download('pdf', 'Gagal mengunduh laporan', () => bagikanPdf(buildStockHtml(reportData()), 'STK'));
  };
  const onExcel = (): void => {
    void download('excel', 'Gagal mengunduh laporan', () => bagikanExcel(buildStockWorkbook(reportData()), 'STK'));
  };

  return (
    <View style={styles.content}>
      {/* 1. Chip filter dengan jumlahnya */}
      <View style={styles.chipRow}>
        {FILTERS.map((item) => (
          <Chip
            key={item.key}
            label={item.label}
            count={counts[item.key]}
            active={filter === item.key}
            onPress={() => setFilter(item.key)}
          />
        ))}
      </View>

      {/* 2. Dua kartu ringkasan, aksen mengikuti ketentuan laporan. */}
      <View style={styles.pair}>
        <Card style={styles.half} spaced={false}>
          <Text style={styles.pairLabel}>Jumlah stok menipis</Text>
          <Text style={[styles.pairValue, styles.warnAccent]}>{menipis.length}</Text>
        </Card>
        <Card style={styles.half} spaced={false}>
          <Text style={styles.pairLabel}>Jumlah stok habis</Text>
          <Text style={[styles.pairValue, styles.dangerAccent]}>{habis.length}</Text>
        </Card>
      </View>

      {productsQuery.isLoading ? (
        <Text style={styles.muted}>Memuat laporan...</Text>
      ) : productsQuery.isError ? (
        <View style={styles.errorBlock}>
          <Text style={styles.error}>{getErrorMessage(productsQuery.error)}</Text>
          <Button label="Coba lagi" onPress={() => void productsQuery.refetch()} />
        </View>
      ) : null}

      {/* 3. Unduh PDF dan Excel */}
      <Card>
        <DownloadActions
          busy={busy}
          onPdf={onPdf}
          onExcel={onExcel}
          disabled={productsQuery.isError || visible.length === 0}
        />
      </Card>

      {/* 4. Kartu "Perlu restok" */}
      <Card>
        <Text style={styles.cardTitle}>Perlu restok</Text>

        {visible.length === 0 ? (
          <Text style={styles.muted}>
            {productsQuery.isLoading ? 'Memuat produk...' : 'Tidak ada produk yang perlu restok.'}
          </Text>
        ) : (
          visible.map((product, index) => (
            <View
              key={product.id}
              style={[styles.row, index > 0 && styles.rowDivider]}
            >
              <View style={styles.initials}>
                <Text style={styles.initialsText}>{initials(product.name)}</Text>
              </View>

              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.rowMeta}>Minimum {product.minStock} pcs</Text>
              </View>

              <StockBadge status={product.stockStatus} sisa={product.stock} />
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  half: { flex: 1 },
  pair: { flexDirection: 'row', gap: spacing.md },
  pairLabel: { fontSize: fontSize.caption, color: colors.textMuted, marginBottom: spacing.hair },
  pairValue: {
    fontSize: fontSize.title,
    fontFamily: home.fontFamily.bold,
    color: navy.dark,
  },
  warnAccent: { color: report.colors.warnAccent },
  dangerAccent: { color: report.colors.dangerAccent },

  cardTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: layout.rowMinHeight,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  initials: {
    width: report.size.initials,
    height: report.size.initials,
    borderRadius: radius.pill,
    backgroundColor: navy.tabActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: fontSize.small,
    fontFamily: home.fontFamily.bold,
    color: navy.dark,
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: colors.text },
  rowMeta: { fontSize: fontSize.caption, color: colors.textMuted, marginTop: spacing.hair },

  muted: { fontSize: fontSize.small, color: colors.textMuted },
  error: { fontSize: fontSize.small, color: colors.danger },
  errorBlock: { gap: spacing.sm },
});
