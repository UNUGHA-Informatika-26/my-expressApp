import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useCheckout } from '../../features/checkout/queries';
import { getErrorMessage } from '../../lib/api';
import { formatRupiah } from '../../lib/format';
import { navy, qris } from '../../lib/theme';
import { totalCart, useCartStore } from '../../store/cart';

/**
 * Nama merchant yang tercetak pada gambar QRIS toko.
 *
 * Ini bukan nama dari sesi login: nilainya harus sama PERSIS dengan yang
 * tertera di gambar `assets/qris.png`, sebab pelanggan membandingkan teks di
 * layar dengan teks pada QR yang mereka pindai. Bila gambar QRIS diganti,
 * ganti pula nilai ini.
 */
const MERCHANT_NAME = 'TOKO EXPRESS';

/**
 * Layar Pembayaran QRIS.
 *
 * Transaksi dibuat BARU ketika tombol "Pembayaran diterima" ditekan. Sebelum
 * itu tidak ada apa pun yang dikirim ke server, sehingga tombol Batal maupun
 * tombol kembali sistem tidak pernah meninggalkan transaksi setengah jadi
 * dan tidak pernah memotong stok untuk pembayaran yang batal.
 *
 * Total diambil langsung dari keranjang (Zustand) — bukan lewat parameter
 * rute — sehingga angkanya tidak mungkin berbeda dengan yang dihitung Kasir.
 */
export default function PembayaranQRISScreen() {
  const items = useCartStore((state) => state.items);
  const total = totalCart(items);
  const checkout = useCheckout();
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = () => {
    if (items.length === 0) {
      Alert.alert('Keranjang kosong', 'Kembali ke Kasir dan pindai barcode dulu.');
      return;
    }

    setSubmitting(true);
    checkout.mutate(
      {
        paymentMethod: 'qris',
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        onSuccess: (transaction) => {
          router.replace({
            pathname: '/pembayaran/berhasil',
            params: {
              // id dipakai layar struk untuk mengambil daftar barang —
              // daftar itu terlalu panjang untuk dikirim lewat parameter rute.
              id: transaction.id,
              code: transaction.code,
              paymentMethod: transaction.paymentMethod,
              total: String(transaction.total),
              // QRIS tidak membawa uang diterima maupun kembalian.
              amountReceived: '',
              changeAmount: '',
            },
          });
        },
        onError: (error: unknown) => {
          // Tetap di layar ini: kasir bisa meminta pelanggan membayar ulang
          // tanpa harus memindai seluruh keranjang dari awal.
          setSubmitting(false);
          Alert.alert('Pembayaran gagal', getErrorMessage(error));
        },
      },
    );
  };

  const onCancel = () => {
    if (submitting) {
      return;
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Pembayaran QRIS</Text>

        {/* Kartu total: gradasi navy yang sama dengan tombol utama. */}
        <View style={styles.totalCard}>
          <LinearGradient
            colors={[navy.main, navy.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.totalLabel}>Total yang harus dibayar</Text>
          <Text style={styles.total}>{formatRupiah(total)}</Text>
        </View>

        <Card spaced={false} style={styles.qrCard}>
          <View style={styles.qrBox}>
            <Image
              source={require('../../assets/qris.png')}
              style={styles.qrImage}
              resizeMode="contain"
              accessibilityLabel="Kode QRIS toko"
            />
          </View>

          <Text style={styles.method}>QRIS</Text>
          <Text style={styles.merchant}>{MERCHANT_NAME}</Text>

          <View style={styles.note}>
            <Ionicons
              name="information-circle-outline"
              size={qris.size.noteIcon}
              color={qris.colors.noteIcon}
            />
            <Text style={styles.noteText}>
              Pastikan notifikasi pembayaran masuk ke HP penjual sebelum lanjutkan.
            </Text>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Pembayaran diterima"
          icon="checkmark-circle"
          onPress={onConfirm}
          loading={submitting}
          disabled={items.length === 0}
        />
        <Button label="Batal" variant="outline" onPress={onCancel} disabled={submitting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: qris.colors.background,
    paddingHorizontal: qris.spacing.screen,
  },
  body: {
    paddingTop: qris.spacing.top,
    paddingBottom: qris.spacing.between,
  },
  title: {
    fontSize: qris.fontSize.title,
    fontWeight: qris.fontWeight.extrabold,
    color: qris.colors.ink,
    marginBottom: qris.spacing.titleGap,
  },
  /** Kartu total navy; `overflow` memotong gradasi mengikuti sudutnya. */
  totalCard: {
    borderRadius: qris.radius.card,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: qris.spacing.cardGap,
    marginBottom: qris.spacing.cardGap,
  },
  totalLabel: {
    fontSize: qris.fontSize.label,
    fontWeight: qris.fontWeight.medium,
    color: qris.colors.onNavyMuted,
  },
  total: {
    fontSize: qris.fontSize.amount,
    fontWeight: qris.fontWeight.extrabold,
    color: '#FFFFFF',
    marginTop: qris.spacing.tight,
  },
  qrCard: {
    alignItems: 'center',
    rowGap: qris.spacing.block,
  },
  qrBox: {
    width: qris.size.qrCard,
    height: qris.size.qrCard,
    borderRadius: qris.radius.qr,
    backgroundColor: qris.colors.surface,
    borderWidth: 1,
    borderColor: qris.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  method: {
    fontSize: qris.fontSize.method,
    fontWeight: qris.fontWeight.bold,
    color: qris.colors.ink,
  },
  merchant: {
    fontSize: qris.fontSize.merchant,
    fontWeight: qris.fontWeight.semibold,
    color: qris.colors.merchant,
    marginTop: -qris.spacing.tight,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: qris.spacing.noteIconGap,
    alignSelf: 'stretch',
    backgroundColor: qris.colors.noteBg,
    borderRadius: qris.radius.note,
    padding: qris.spacing.notePadding,
    marginTop: qris.spacing.tight,
  },
  noteText: {
    flex: 1,
    fontSize: qris.fontSize.note,
    color: qris.colors.noteText,
    lineHeight: 18,
  },
  footer: {
    paddingBottom: qris.spacing.bottom,
    rowGap: qris.spacing.buttonGap,
  },
});
