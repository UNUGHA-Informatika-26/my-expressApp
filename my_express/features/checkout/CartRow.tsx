import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatRupiah } from '../../lib/format';
import { colors, fontSize, navy } from '../../lib/theme';
import type { CartItem } from '../../types/api';

interface Props {
  item: CartItem;
  /** Ubah jumlah baris (tombol − dan +). */
  onChangeQuantity: (productId: string, quantity: number) => void;
  /** Hapus baris dari keranjang (tombol silang). */
  onRemove: (productId: string) => void;
}

/** Satu baris keranjang kasir: nama, harga, kontrol jumlah, dan subtotal. */
export function CartRow({ item, onChangeQuantity, onRemove }: Props) {
  const atMax = item.quantity >= item.stock;

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Hapus ${item.name} dari keranjang`}
          onPress={() => onRemove(item.productId)}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Ionicons name="close-circle" size={22} color="#9CA3AF" />
        </Pressable>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.price}>{formatRupiah(item.price)}</Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Kurangi jumlah ${item.name}`}
            onPress={() => onChangeQuantity(item.productId, item.quantity - 1)}
            style={({ pressed }) => [styles.step, pressed && styles.pressed]}
          >
            <Ionicons name="remove" size={18} color={navy.main} />
          </Pressable>

          {/* Jumlah ditulis lengkap dengan satuannya, mis. "2 rim",
              supaya kasir tidak perlu menebak satuan barang. */}
          <View style={styles.qtyWrap}>
            <Text style={styles.qty}>{item.quantity}</Text>
            <Text style={styles.qtySatuan}>{item.satuan}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Tambah jumlah ${item.name}`}
            accessibilityState={{ disabled: atMax }}
            onPress={() => onChangeQuantity(item.productId, item.quantity + 1)}
            disabled={atMax}
            style={({ pressed }) => [styles.step, pressed && styles.pressed, atMax && styles.stepDisabled]}
          >
            <Ionicons name="add" size={18} color={atMax ? '#9CA3AF' : navy.main} />
          </Pressable>
        </View>

        <Text style={styles.subtotal}>{formatRupiah(item.price * item.quantity)}</Text>
      </View>

      {atMax && (
        <Text style={styles.hint}>Stok tersisa {item.stock} {item.satuan}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pressed: { opacity: 0.6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  price: { fontSize: 14, color: '#6B7280', width: 88 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  step: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisabled: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  qtyWrap: { minWidth: 44, alignItems: 'center' },
  qty: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#111827' },
  qtySatuan: { fontSize: fontSize.caption, color: colors.textMuted, marginTop: 1 },
  subtotal: { fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'right', minWidth: 88 },
  hint: { fontSize: 12, color: '#B45309', marginTop: 8 },
});
