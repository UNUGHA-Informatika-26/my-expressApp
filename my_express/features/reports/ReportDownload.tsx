import dayjs from 'dayjs';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { getErrorMessage } from '../../lib/api';
import { text } from '../../lib/theme';
import { fetchStockReport, fetchTransactionsReport, type TransactionReportRange } from './api';
import { saveAndShareCsv } from './saveCsv';

/** Rentang cepat; memakai tombol karena tidak ada date picker di 02-teknologi.md. */
type RangeKey = 'hari-ini' | '7-hari' | '30-hari' | 'semua';

const RANGE_LABELS: { key: RangeKey; label: string }[] = [
  { key: 'hari-ini', label: 'Hari ini' },
  { key: '7-hari', label: '7 hari' },
  { key: '30-hari', label: '30 hari' },
  { key: 'semua', label: 'Semua' },
];

/** Rentang tanggal `YYYY-MM-DD` dari tombol yang dipilih. */
function rangeOf(key: RangeKey): TransactionReportRange {
  if (key === 'semua') {
    return {};
  }
  const today = dayjs();
  const backDays = key === 'hari-ini' ? 0 : key === '7-hari' ? 6 : 29;
  return {
    from: today.subtract(backDays, 'day').format('YYYY-MM-DD'),
    to: today.format('YYYY-MM-DD'),
  };
}

/** Jenis laporan yang sedang diunduh; null berarti tidak ada. */
type Busy = 'transaksi' | 'stok' | null;

/**
 * Bagian unduh laporan di halaman Akun (konsep.md bagian 11).
 *
 * Alurnya: ambil CSV dari server → tulis ke cache lewat `File`/`Paths`
 * → buka lembar berbagi sistem, sehingga pengguna bisa menyimpannya ke
 * penyimpanan atau mengirimkannya ke aplikasi lain.
 */
export function ReportDownload() {
  const [rangeKey, setRangeKey] = useState<RangeKey>('7-hari');
  const [busy, setBusy] = useState<Busy>(null);

  const download = async (kind: NonNullable<Busy>) => {
    setBusy(kind);
    try {
      const report =
        kind === 'transaksi'
          ? await fetchTransactionsReport(rangeOf(rangeKey))
          : await fetchStockReport();

      await saveAndShareCsv(
        report.filename,
        report.csv,
        kind === 'transaksi' ? 'Bagikan laporan transaksi' : 'Bagikan laporan stok',
      );
    } catch (error) {
      // Pesan dari server (400/401/500) sudah berbahasa Indonesia.
      const title =
        kind === 'transaksi'
          ? 'Gagal mengunduh laporan transaksi'
          : 'Gagal mengunduh laporan stok';
      Alert.alert(title, getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <Text style={text.cardTitle}>Unduh laporan</Text>

      <Text style={styles.sectionLabel}>Laporan transaksi</Text>
      <View style={styles.chipRow}>
        {RANGE_LABELS.map((item) => {
          const active = item.key === rangeKey;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setRangeKey(item.key)}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Button
        label="Unduh laporan transaksi"
        onPress={() => void download('transaksi')}
        loading={busy === 'transaksi'}
        disabled={busy !== null}
      />

      <Text style={[styles.sectionLabel, styles.spaced]}>Laporan stok</Text>
      <Button
        label="Unduh laporan stok"
        onPress={() => void download('stok')}
        loading={busy === 'stok'}
        disabled={busy !== null}
      />

      <Text style={styles.note}>File berformat CSV dan bisa dibuka di Excel atau Google Sheets.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 8 },
  spaced: { marginTop: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#F9FAFB',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  pressed: { opacity: 0.7 },
  note: { fontSize: 12, color: '#9CA3AF', marginTop: 12, lineHeight: 17 },
});
