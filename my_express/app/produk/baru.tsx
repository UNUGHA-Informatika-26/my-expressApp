import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ProductForm, EMPTY_PRODUCT_VALUES } from '../../features/catalog/ProductForm';
import { useCreateProduct } from '../../features/catalog/queries';
import { getErrorMessage } from '../../lib/api';

/**
 * Layar tambah produk baru (dipakai tombol + di Katalog, dan hasil scan
 * barcode yang belum terdaftar — barcode-nya diisi otomatis dari parameter).
 */
export default function ProdukBaruScreen() {
  const params = useLocalSearchParams<{ barcode?: string }>();
  const scannedBarcode = typeof params.barcode === 'string' ? params.barcode : '';

  const createMutation = useCreateProduct();

  const onSubmit = (payload: Parameters<typeof createMutation.mutate>[0]) => {
    createMutation.mutate(payload, {
      onSuccess: () => {
        Alert.alert('Berhasil', 'Produk baru sudah ditambahkan.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      },
      onError: (error) => {
        // 409 barcode ganda tampil sebagai pesan dari server.
        Alert.alert('Gagal menambah produk', getErrorMessage(error));
      },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Produk Baru',
          headerTintColor: '#2563EB',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#111827' },
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ProductForm
          key={scannedBarcode || 'kosong'}
          defaultValues={{ ...EMPTY_PRODUCT_VALUES, barcode: scannedBarcode }}
          submitLabel="Simpan Produk"
          onSubmit={onSubmit}
          submitting={createMutation.isPending}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
});
