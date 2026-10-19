import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { OptionPicker } from '../../components/OptionPicker';
import { ProductCard } from '../../features/catalog/ProductCard';
import { getProductByBarcode } from '../../features/catalog/api';
import { useCategories, useProducts } from '../../features/catalog/queries';
import { ScanButton } from '../../features/scan/ScanButton';
import { TabHeaderTitle } from '../../features/tabs/TabHeaderTitle';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { getErrorMessage, isNotFound } from '../../lib/api';
import { formatRupiah } from '../../lib/format';
import { navy } from '../../lib/theme';
import { countCart, totalCart, useCartStore } from '../../store/cart';
import type { Product, StockStatus } from '../../types/api';

/** Pilihan filter status stok; null = tampilkan semua. */
type StockFilter = StockStatus | null;

const STOCK_FILTERS: { value: StockFilter; label: string }[] = [
  { value: null, label: 'Semua' },
  { value: 'aman', label: 'Aman' },
  { value: 'menipis', label: 'Menipis' },
  { value: 'habis', label: 'Habis' },
];

export default function KatalogScreen() {
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [stock, setStock] = useState<StockFilter>(null);

  // Keranjang ada di Zustand; hanya keranjang, sesi login, dan notifikasi
  // yang boleh memakai Zustand (AGENTS.md).
  const cartItems = useCartStore((state) => state.items);
  const tambah = useCartStore((state) => state.tambah);

  // Tunda pencarian supaya tidak memanggil API di setiap ketukan keyboard.
  const search = useDebouncedValue(searchText, 300);

  const filter = useMemo(
    () => ({
      search: search.trim() || undefined,
      category: category ?? undefined,
      stock: stock ?? undefined,
    }),
    [search, category, stock],
  );

  const productsQuery = useProducts(filter);
  const categoriesQuery = useCategories();

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const jumlahItem = countCart(cartItems);

  const openProduct = (product: Product) => {
    router.push({ pathname: '/produk/[id]', params: { id: product.id } });
  };

  const openNewProduct = () => {
    router.push('/produk/baru');
  };

  /**
   * Tambah ke keranjang lewat Katalog (tugas Fase 5).
   * Kalau stok habis, tombol + di kartu sudah nonaktif; penjaga ini
   * tetap dipasang supaya aman kalau data berubah di latar belakang.
   */
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('Stok habis', `"${product.name}" sedang habis.`);
      return;
    }
    tambah(product);
  };

  /**
   * Scan dari Katalog (tugas Fase 4):
   * barcode terdaftar → tawarkan membuka produknya;
   * barcode belum terdaftar → buka form Produk baru dengan barcode terisi.
   */
  const onScanFromCatalog = (code: string) => {
    getProductByBarcode(code)
      .then((product) => {
        Alert.alert('Barcode sudah terdaftar', `"${product.name}" sudah ada di katalog.`, [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Buka Produk',
            onPress: () =>
              router.push({ pathname: '/produk/[id]', params: { id: product.id } }),
          },
        ]);
      })
      .catch((error: unknown) => {
        if (isNotFound(error)) {
          router.push({ pathname: '/produk/baru', params: { barcode: code } });
          return;
        }
        Alert.alert('Gagal memeriksa barcode', getErrorMessage(error));
      });
  };

  const adaFilter = Boolean(search.trim() || category || stock);

  return (
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          headerTitle: () => (
            <TabHeaderTitle
              title="Katalog"
              // Respons daftar produk tidak membawa jumlah total, jadi saat
              // filter aktif hanya jumlah yang tampil yang bisa disebut —
              // menyebut "dari 24" berarti meminta ulang seluruh katalog.
              subtitle={
                adaFilter
                  ? `${products.length} produk ditampilkan`
                  : `${products.length} produk`
              }
            />
          ),
        }}
      />
      <View style={styles.toolbar}>
        <TextInput
          style={styles.search}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Cari nama atau barcode..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Cari produk"
        />
        <ScanButton variant="icon" label="Pindai barcode" onResult={onScanFromCatalog} />
      </View>

      <View style={styles.filters}>
        <OptionPicker
          label="Kategori"
          value={category}
          options={categories}
          allLabel="Semua kategori"
          onSelect={setCategory}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {STOCK_FILTERS.map((item) => (
            <Chip
              key={item.label}
              label={item.label}
              active={stock === item.value}
              onPress={() => setStock(item.value)}
            />
          ))}
        </ScrollView>
      </View>

      {productsQuery.isLoading ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Memuat produk...</Text>
        </View>
      ) : productsQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{getErrorMessage(productsQuery.error)}</Text>
          <Button label="Coba lagi" onPress={() => productsQuery.refetch()} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={openProduct} onAdd={addToCart} />
          )}
          contentContainerStyle={styles.list}
          refreshing={productsQuery.isRefetching}
          onRefresh={() => productsQuery.refetch()}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Belum ada produk</Text>
              <Text style={styles.muted}>
                {search.trim() || category || stock
                  ? 'Tidak ada produk yang cocok dengan pencarian atau filter.'
                  : 'Tekan tombol + untuk menambah produk pertama.'}
              </Text>
            </View>
          }
        />
      )}

      {jumlahItem > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Buka kasir, ${jumlahItem} item dalam keranjang`}
          onPress={() => router.push('/(tabs)/kasir')}
          style={({ pressed }) => [styles.cartBar, pressed && styles.fabPressed]}
        >
          <Ionicons name="cart" size={18} color="#FFFFFF" />
          <Text style={styles.cartBarText}>
            {jumlahItem} item · {formatRupiah(totalCart(cartItems))}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tambah produk"
        onPress={openNewProduct}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        {/* Gradasi yang sama dengan kartu penjualan di Beranda. */}
        <LinearGradient
          colors={[navy.main, navy.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
    >
      {/* Gradasi hanya dipasang saat aktif; chip nonaktif tetap berlatar putih. */}
      {active && (
        <LinearGradient
          colors={[navy.main, navy.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: navy.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  search: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  /** Padding kiri-kanan ditaruh di wadah ini, bukan di tiap anaknya, supaya
   *  kolom pemilih kategori dan baris chip status sejajar tepat. */
  filters: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    // Latar chip aktif kini gradasi; `overflow: hidden` memotongnya
    // mengikuti sudut membulat.
    borderColor: navy.main,
    overflow: 'hidden',
  },
  chipPressed: { opacity: 0.7 },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 96 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  muted: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    // `overflow: hidden` memotong gradasi mengikuti sudut membulat.
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabPressed: { opacity: 0.85 },
  cartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 92,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cartBarText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
