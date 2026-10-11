import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { ProductForm } from '../../features/catalog/ProductForm';
import type { ProductPayload } from '../../features/catalog/validation';
import {
  useDeleteProduct,
  useProduct,
  useUpdateProduct,
} from '../../features/catalog/queries';
import { getErrorMessage } from '../../lib/api';
import { formatRupiah } from '../../lib/format';

/** Layar ubah dan hapus produk (dibuka dengan menukar kartu di Katalog). */
export default function ProdukDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const productQuery = useProduct(id, id.length > 0);
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const onSubmit = (payload: ProductPayload) => {
    updateMutation.mutate(
      { id, payload },
      {
        onSuccess: () => {
          Alert.alert('Berhasil', 'Perubahan produk sudah disimpan.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (error) => {
          Alert.alert('Gagal menyimpan produk', getErrorMessage(error));
        },
      },
    );
  };

  const onDelete = () => {
    const name = productQuery.data?.name ?? 'produk ini';
    Alert.alert('Hapus Produk', `Yakin ingin menghapus "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          deleteMutation.mutate(id, {
            onSuccess: () => router.back(),
            onError: (error) => Alert.alert('Gagal menghapus produk', getErrorMessage(error)),
          });
        },
      },
    ]);
  };

  if (productQuery.isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen
          options={{ headerShown: true, title: 'Ubah Produk', headerTintColor: '#2563EB' }}
        />
        <Text style={styles.muted}>Memuat produk...</Text>
      </View>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <View style={styles.center}>
        <Stack.Screen
          options={{ headerShown: true, title: 'Ubah Produk', headerTintColor: '#2563EB' }}
        />
        <Text style={styles.errorText}>
          {productQuery.error ? getErrorMessage(productQuery.error) : 'Produk tidak ditemukan'}
        </Text>
        <Button label="Kembali" onPress={() => router.back()} />
      </View>
    );
  }

  const product = productQuery.data;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Ubah Produk',
          headerTintColor: '#2563EB',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#111827' },
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Harga saat ini</Text>
          <Text style={styles.summaryValue}>{formatRupiah(product.price)}</Text>
        </View>

        <ProductForm
          key={product.id}
          defaultValues={{
            barcode: product.barcode,
            name: product.name,
            category: product.category,
            price: String(product.price),
            stock: String(product.stock),
            minStock: String(product.minStock),
          }}
          submitLabel="Simpan Perubahan"
          onSubmit={onSubmit}
          submitting={updateMutation.isPending}
        />

        <View style={styles.deleteWrap}>
          <Button label="Hapus Produk" onPress={onDelete} variant="danger" loading={deleteMutation.isPending} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', padding: 24, gap: 16 },
  content: { padding: 16 },
  summary: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  summaryLabel: { fontSize: 13, color: '#1E40AF' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#1E40AF', marginTop: 2 },
  muted: { fontSize: 15, color: '#6B7280' },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  deleteWrap: { marginTop: 24 },
});
