import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { CartRow } from '../../features/checkout/CartRow';
import { useCheckout } from '../../features/checkout/queries';
import {
  paymentSchema,
  type CheckoutPayload,
  type PaymentFormValues,
} from '../../features/checkout/validation';
import { getProductByBarcode } from '../../features/catalog/api';
import { ScanButton } from '../../features/scan/ScanButton';
import { getErrorMessage, isNotFound } from '../../lib/api';
import { formatRupiah } from '../../lib/format';
import { countCart, totalCart, useCartStore } from '../../store/cart';

const PAYMENT_METHODS: { value: PaymentFormValues['paymentMethod']; label: string }[] = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
  { value: 'transfer', label: 'Transfer' },
];

export default function KasirScreen() {
  const items = useCartStore((state) => state.items);
  const ubahJumlah = useCartStore((state) => state.ubahJumlah);
  const hapus = useCartStore((state) => state.hapus);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentFormValues['paymentMethod']>('tunai');
  const [amountReceived, setAmountReceived] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const checkoutMutation = useCheckout();

  const total = useMemo(() => totalCart(items), [items]);
  const jumlahItem = countCart(items);

  // Kembalian dihitung otomatis selama uang diterima sudah berupa angka.
  const parsedAmount = Number.parseInt(amountReceived, 10);
  const hasAmount = amountReceived.trim() !== '' && Number.isFinite(parsedAmount);
  const changeAmount = hasAmount ? Math.max(parsedAmount - total, 0) : 0;
  const isShort = paymentMethod === 'tunai' && hasAmount && parsedAmount < total;

  /**
   * Scan dari layar Kasir (tugas Fase 5):
   * barcode terdaftar → langsung masuk keranjang;
   * barcode tidak dikenal → beri tahu kasir.
   */
  const onScanFromKasir = (code: string) => {
    getProductByBarcode(code)
      .then((product) => {
        if (product.stock <= 0) {
          Alert.alert('Stok habis', `"${product.name}" sedang habis.`);
          return;
        }
        useCartStore.getState().tambah(product);
      })
      .catch((error: unknown) => {
        if (isNotFound(error)) {
          Alert.alert('Barcode tidak ditemukan', `Kode "${code}" belum ada di katalog.`);
          return;
        }
        Alert.alert('Gagal memeriksa barcode', getErrorMessage(error));
      });
  };

  /** Susun payload checkout; null berarti form belum lolos validasi. */
  const buildPayload = (): CheckoutPayload | null => {
    const result = paymentSchema.safeParse({ paymentMethod, amountReceived });

    if (!result.success) {
      const issue = result.error.issues[0];
      setFormError(issue.message);
      return null;
    }

    setFormError(null);
    const rawAmount = result.data.amountReceived?.trim() ?? '';
    // superRefine menjamin isi berupa angka untuk tunai.
    const amount = Number.parseInt(rawAmount, 10);

    return {
      paymentMethod: result.data.paymentMethod,
      amountReceived: result.data.paymentMethod === 'tunai' ? amount : undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };
  };

  const onPay = () => {
    if (items.length === 0) {
      Alert.alert('Keranjang kosong', 'Pindai barcode atau tambahkan produk dulu.');
      return;
    }

    const payload = buildPayload();
    if (!payload) {
      return;
    }

    checkoutMutation.mutate(payload, {
      onSuccess: (transaction) => {
        router.replace({
          pathname: '/pembayaran/berhasil',
          params: {
            code: transaction.code,
            paymentMethod: transaction.paymentMethod,
            total: String(transaction.total),
            amountReceived:
              transaction.amountReceived == null ? '' : String(transaction.amountReceived),
            changeAmount: transaction.changeAmount == null ? '' : String(transaction.changeAmount),
          },
        });
      },
      onError: (error: unknown) => {
        Alert.alert('Pembayaran gagal', getErrorMessage(error));
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.title}>Kasir</Text>
        <ScanButton variant="icon" label="Pindai barcode ke keranjang" onResult={onScanFromKasir} />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Keranjang kosong</Text>
          <Text style={styles.muted}>
            Pindai barcode atau tambahkan produk dari tab Katalog.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.productId}
          renderItem={({ item }) => (
            <CartRow item={item} onChangeQuantity={ubahJumlah} onRemove={hapus} />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <View style={styles.panel}>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>{jumlahItem} item</Text>
          <Text style={styles.summaryTotal}>{formatRupiah(total)}</Text>
        </View>

        <Text style={styles.sectionLabel}>Metode bayar</Text>
        <View style={styles.methods}>
          {PAYMENT_METHODS.map((method) => {
            const active = paymentMethod === method.value;
            return (
              <Pressable
                key={method.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setPaymentMethod(method.value);
                  setFormError(null);
                }}
                style={({ pressed }) => [
                  styles.method,
                  active && styles.methodActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.methodText, active && styles.methodTextActive]}>
                  {method.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {paymentMethod === 'tunai' && (
          <View style={styles.cashBox}>
            <TextInput
              style={styles.cashInput}
              value={amountReceived}
              onChangeText={(text) => {
                setAmountReceived(text);
                setFormError(null);
              }}
              placeholder="Uang diterima"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              accessibilityLabel="Uang diterima"
            />
            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Kembalian</Text>
              <Text style={[styles.changeValue, isShort && styles.changeShort]}>
                {isShort ? `Kurang ${formatRupiah(total - parsedAmount)}` : formatRupiah(changeAmount)}
              </Text>
            </View>
          </View>
        )}

        {formError && <Text style={styles.error}>{formError}</Text>}

        <Button
          label={items.length === 0 ? 'Bayar' : `Bayar ${formatRupiah(total)}`}
          onPress={onPay}
          loading={checkoutMutation.isPending}
          disabled={items.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 4 },
  muted: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  list: { padding: 16, paddingBottom: 8 },
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryTotal: { fontSize: 20, fontWeight: '800', color: '#111827' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginTop: 14, marginBottom: 8 },
  methods: { flexDirection: 'row', gap: 8 },
  method: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  pressed: { opacity: 0.75 },
  methodText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  methodTextActive: { color: '#FFFFFF' },
  cashBox: { marginTop: 12, gap: 8 },
  cashInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  changeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  changeLabel: { fontSize: 14, color: '#6B7280' },
  changeValue: { fontSize: 16, fontWeight: '700', color: '#059669' },
  changeShort: { color: '#DC2626' },
  error: { fontSize: 13, color: '#DC2626', marginTop: 10 },
});
