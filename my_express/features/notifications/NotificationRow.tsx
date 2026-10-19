import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDateTime, formatShortDate } from '../../lib/date';
import { formatRupiah } from '../../lib/format';
import { navy } from '../../lib/theme';
import type { NotificationItem, NotificationType } from '../../types/api';

/** Tampilan tiap jenis peringatan: ikon, warna, dan latar bulatan. */
const PRESENTATION: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; background: string }
> = {
  stok_habis: { icon: 'alert-circle', color: '#DC2626', background: '#FEE2E2' },
  stok_menipis: { icon: 'warning', color: '#D97706', background: '#FEF3C7' },
  hutang_jatuh_tempo: { icon: 'time', color: navy.main, background: '#DBEAFE' },
};

/** Satu baris peringatan pada layar Notifikasi. */
export function NotificationRow({ item }: { item: NotificationItem }) {
  const presentation =
    item.type === 'hutang_jatuh_tempo' && item.isOverdue
      ? { icon: 'alert-circle' as const, color: '#B91C1C', background: '#FEE2E2' }
      : PRESENTATION[item.type];

  const onPress = () => {
    if (item.productId) {
      router.push({ pathname: '/produk/[id]', params: { id: item.productId } });
    } else if (item.debtId) {
      router.push(`/hutang/${item.debtId}`);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconBox, { backgroundColor: presentation.background }]}>
        <Ionicons name={presentation.icon} size={18} color={presentation.color} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>

        {item.type === 'hutang_jatuh_tempo' && (
          <Text style={styles.meta}>
            {item.remaining !== undefined && `Sisa ${formatRupiah(item.remaining)}`}
            {item.remaining !== undefined && item.dueDate && ' · '}
            {item.dueDate && `Jatuh tempo ${formatShortDate(item.dueDate)}`}
          </Text>
        )}

        <Text style={styles.time}>{formatDateTime(item.occurredAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
  },
  pressed: { opacity: 0.7 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },
  message: { fontSize: 13, color: '#374151', lineHeight: 18 },
  meta: { fontSize: 12, fontWeight: '600', color: '#B91C1C', marginTop: 2 },
  time: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
});
