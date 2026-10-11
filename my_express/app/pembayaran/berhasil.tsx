import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { formatRupiah } from '../../lib/format';
import { spacing } from '../../lib/theme';
import type { PaymentMethod } from '../../types/api';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  tunai: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
};

/** Angka dari parameter rute; kosong atau tidak valid berarti null. */
function toNumber(value: string | undefined): number | null {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Layar Pembayaran Berhasil (tugas Fase 5).
 * Keranjang sudah dikosongkan dan daftar produk sudah di-refresh oleh
 * useCheckout sebelum layar ini dibuka.
 */
export default function PembayaranBerhasilScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    paymentMethod?: string;
    total?: string;
    amountReceived?: string;
    changeAmount?: string;
  }>();

  const code = params.code ?? '-';
  const method = (params.paymentMethod ?? 'tunai') as PaymentMethod;
  const total = toNumber(params.total) ?? 0;
  const amountReceived = toNumber(params.amountReceived);
  const changeAmount = toNumber(params.changeAmount);
  const isCash = method === 'tunai';

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={44} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Pembayaran Berhasil</Text>
        <Text style={styles.subtitle}>Transaksi sudah tersimpan.</Text>

        <Card spaced={false} style={styles.cardLayout}>
          <Row label="Nomor transaksi" value={code} strong />
          <Row label="Metode bayar" value={METHOD_LABEL[method] ?? method} />
          <Row label="Total" value={formatRupiah(total)} strong />

          {isCash && amountReceived != null && (
            <Row label="Uang diterima" value={formatRupiah(amountReceived)} />
          )}
          {isCash && changeAmount != null && (
            <Row label="Kembalian" value={formatRupiah(changeAmount)} highlight />
          )}
        </Card>
      </View>

      <View style={styles.footer}>
        <Button label="Selesai" onPress={() => router.replace('/(tabs)/kasir')} />
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  strong = false,
  highlight = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          strong && styles.rowValueStrong,
          highlight && styles.rowValueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 20, paddingTop: 48 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 20 },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 6 },
  /** Kartu ringkasan memakai lebar penuh dan padding vertikal lebih rapat. */
  cardLayout: { width: '100%', paddingVertical: spacing.sm, marginTop: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 15, color: '#111827', flexShrink: 1, textAlign: 'right' },
  rowValueStrong: { fontWeight: '800', fontSize: 16 },
  rowValueHighlight: { color: '#059669', fontWeight: '800' },
  footer: { paddingBottom: 28 },
});
