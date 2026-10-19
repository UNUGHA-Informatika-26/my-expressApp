import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Receipt } from '../../components/Receipt';
import { useTransaction } from '../../features/history/queries';
import { formatRupiah } from '../../lib/format';
import { buildReceiptText, PAYMENT_METHOD_LABEL } from '../../lib/receiptText';
import { colors, navy, spacing } from '../../lib/theme';
import { useAuthStore } from '../../store/auth';
import { useCartStore } from '../../store/cart';
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
 * Layar Pembayaran Berhasil (tugas Fase 5) beserta tampilan struknya.
 * Keranjang sudah dikosongkan dan daftar produk sudah di-refresh oleh
 * useCheckout sebelum layar ini dibuka.
 *
 * Daftar barang terlalu panjang untuk dikirim lewat parameter rute, jadi
 * struk diambil dari GET /transactions/:id memakai id transaksi yang sama
 * dengan yang dipakai layar riwayat.
 */
export default function PembayaranBerhasilScreen() {
  const params = useLocalSearchParams<{
    id?: string;
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

  const id = params.id ?? '';
  const transactionQuery = useTransaction(id);
  const transaction = transactionQuery.data;

  // Kepala struk: nama toko dan telepon dari sesi login, kasir = nama pemilik.
  const user = useAuthStore((state) => state.user);
  const kosongkan = useCartStore((state) => state.kosongkan);

  const header = {
    storeName: user?.storeName,
    phone: user?.phone,
    cashierName: user?.name,
  };

  const onShare = async () => {
    if (!transaction) {
      Alert.alert('Struk belum siap', 'Data transaksi masih dimuat. Coba lagi sebentar.');
      return;
    }
    try {
      await Share.share({ message: buildReceiptText(transaction, undefined, header) });
    } catch (error) {
      Alert.alert('Gagal membagikan', error instanceof Error ? error.message : 'Coba lagi.');
    }
  };

  const onPrint = () => {
    // TODO: sambungkan printer thermal di sini ketika perangkatnya sudah
    // terhubung. Tombolnya masih dimatikan, jadi sementara hanya memberi tahu.
    Alert.alert('Cetak struk', 'Belum tersedia — printer thermal belum terhubung.');
  };

  const onNewTransaction = () => {
    // Keranjang sebenarnya sudah dikosongkan useCheckout; dipanggil ulang
    // tidak merusak apa pun dan menjamin layar Kasir benar-benar kosong.
    kosongkan();
    router.replace('/(tabs)/kasir');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
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

        {/* Loading dan error struk ditampilkan sebelum kertasnya,
            supaya layar tidak pernah diam tanpa keterangan. */}
        {transactionQuery.isPending ? <Text style={styles.status}>Memuat struk…</Text> : null}
        {transactionQuery.isError ? <Text style={styles.statusError}>Struk tidak bisa dimuat.</Text> : null}

        {transaction ? (
          <View style={styles.receiptWrap}>
            <Receipt
              storeName={user?.storeName}
              phone={user?.phone}
              cashierName={user?.name}
              invoiceNo={transaction.code}
              createdAt={transaction.createdAt}
              items={transaction.items.map((item) => ({
                name: item.productName,
                qty: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
              }))}
              total={transaction.total}
              paymentMethod={PAYMENT_METHOD_LABEL[transaction.paymentMethod]}
              amountPaid={transaction.amountReceived}
              change={transaction.changeAmount}
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Bagikan struk" onPress={() => void onShare()} disabled={!transaction} />
        {/* TODO: ganti menjadi tombol aktif ketika printer thermal sudah terhubung. */}
        <Button label="Cetak struk" onPress={onPrint} disabled />
        <Text style={styles.soon}>Segera hadir</Text>
        <Button label="Transaksi baru" onPress={onNewTransaction} />
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
  container: { flex: 1, backgroundColor: navy.background, paddingHorizontal: 20, paddingTop: 48 },
  /** Isinya kini memanjang (kartu ringkasan + struk), jadi digulir, bukan dipusatkan. */
  body: { alignItems: 'center', paddingBottom: spacing.xxl },
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
  /** Jarak kertas struk ke kartu ringkasan di atasnya. */
  receiptWrap: { marginTop: spacing.xxl, width: '100%' },
  status: { fontSize: 14, color: navy.textSecondary, marginTop: spacing.xxl, textAlign: 'center' },
  statusError: { fontSize: 14, color: colors.danger, marginTop: spacing.xxl, textAlign: 'center' },
  /** Keterangan kecil di bawah tombol Cetak yang masih dimatikan. */
  soon: {
    fontSize: 12,
    color: navy.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  footer: { paddingBottom: 28, gap: spacing.sm },
});
