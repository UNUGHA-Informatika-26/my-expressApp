import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { formatRupiah } from '../../lib/format';
import type { Product } from '../../types/api';
import { StockBadge } from './StockBadge';

interface Props {
  product: Product;
  /** Dipanggil saat kartu ditukuk (dipakai untuk membuka layar ubah). */
  onPress: (product: Product) => void;
  /**
   * Dipanggil saat tombol + ditukuk (tugas Fase 5: tambah ke keranjang).
   * Jika tidak diisi, tombolnya tidak ditampilkan.
   */
  onAdd?: (product: Product) => void;
}

/** Satu baris produk: nama, barcode, kategori, harga, stok, dan lencana status. */
export function ProductCard({ product, onPress, onAdd }: Props) {
  const outOfStock = product.stock <= 0;

  return (
    <Card onPress={() => onPress(product)} accessibilityLabel={product.name}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <StockBadge status={product.stockStatus} />
      </View>

      <Text style={styles.meta}>
        {product.category} · Barcode {product.barcode}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.price}>{formatRupiah(product.price)}</Text>
        <Text style={styles.stock}>
          Stok: {product.stock}
          {product.minStock > 0 ? ` (min. ${product.minStock})` : ''}
        </Text>

        {onAdd && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Tambah ${product.name} ke keranjang`}
            accessibilityState={{ disabled: outOfStock }}
            onPress={() => onAdd(product)}
            disabled={outOfStock}
            hitSlop={6}
            style={({ pressed }) => [
              styles.add,
              pressed && styles.pressed,
              outOfStock && styles.addDisabled,
            ]}
          >
            <Ionicons name="add" size={20} color={outOfStock ? '#9CA3AF' : '#FFFFFF'} />
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  price: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  stock: { fontSize: 13, color: '#374151', flex: 1, textAlign: 'right' },
  add: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDisabled: { backgroundColor: '#F3F4F6' },
});
