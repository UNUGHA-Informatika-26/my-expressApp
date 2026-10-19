import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Receipt } from '../../components/Receipt';
import { useTransaction } from '../../features/history/queries';
import { PAYMENT_METHOD_LABEL } from '../../lib/receiptText';
import { colors, navy, spacing } from '../../lib/theme';
import { useAuthStore } from '../../store/auth';

/** Judul header dipakai di ketiga keadaan layar, supaya tidak berulang. */
const HEADER_OPTIONS = { headerShown: true, title: 'Struk', headerTintColor: navy.main } as const;

/**
 * Layar struk satu transaksi — pintu masuk dari Riwayat.
 *
 * Memakai GET /transactions/:id yang sama dengan layar Pembayaran Berhasil,
 * sehingga struk yang tampil benar-benar identik dari kedua pintu masuknya.
 */
export default function TransaksiDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? '';

  const transactionQuery = useTransaction(id);
  const transaction = transactionQuery.data;

  // Kepala struk: nama toko dan telepon dari sesi login, kasir = nama pemilik.
  const user = useAuthStore((state) => state.user);

  if (transactionQuery.isPending) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={HEADER_OPTIONS} />
        <Text style={styles.muted}>Memuat struk...</Text>
      </View>
    );
  }

  if (transactionQuery.isError || !transaction) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={HEADER_OPTIONS} />
        <Text style={styles.errorText}>Struk tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={HEADER_OPTIONS} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: navy.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: navy.background,
  },
  body: { padding: spacing.xl },
  muted: { fontSize: 14, color: navy.textSecondary },
  errorText: { fontSize: 14, color: colors.danger },
});
