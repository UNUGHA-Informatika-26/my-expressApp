import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductForm, EMPTY_PRODUCT_VALUES } from '../../features/catalog/ProductForm';
import { useCreateProduct } from '../../features/catalog/queries';
import { getErrorMessage } from '../../lib/api';
import { navy } from '../../lib/theme';

/**
 * Layar tambah produk baru (dipakai tombol + di Katalog, dan hasil scan
 * barcode yang belum terdaftar — barcode-nya diisi otomatis dari parameter).
 */
export default function ProdukBaruScreen() {
  const params = useLocalSearchParams<{ barcode?: string }>();
  const scannedBarcode = typeof params.barcode === 'string' ? params.barcode : '';
  /* Layar ini berada di luar tab bar, jadi tepi bawah layar adalah batas
     fisik HP (gesture bar / tombol nav). Tanpa inset ini tombol "Simpan
     Produk" tertutup dan tidak bisa digulir sampai terlihat. */
  const insets = useSafeAreaInsets();

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
          headerTintColor: navy.main,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#111827' },
        }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <ProductForm
            key={scannedBarcode || 'kosong'}
            defaultValues={{ ...EMPTY_PRODUCT_VALUES, barcode: scannedBarcode }}
            submitLabel="Simpan Produk"
            onSubmit={onSubmit}
            submitting={createMutation.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: navy.background },
  flex: { flex: 1 },
  content: { padding: 16 },
});
