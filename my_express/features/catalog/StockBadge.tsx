import { StyleSheet, Text, View } from 'react-native';
import type { StockStatus } from '../../types/api';

const LABEL: Record<StockStatus, string> = {
  aman: 'Aman',
  menipis: 'Menipis',
  habis: 'Habis',
};

const COLOR: Record<StockStatus, { bg: string; text: string }> = {
  aman: { bg: '#DCFCE7', text: '#166534' },
  menipis: { bg: '#FEF3C7', text: '#92400E' },
  habis: { bg: '#FEE2E2', text: '#991B1B' },
};

interface Props {
  status: StockStatus;
}

/** Lencana status stok: hijau (aman), kuning (menipis), merah (habis). */
export function StockBadge({ status }: Props) {
  const color = COLOR[status];
  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>{LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '700' },
});
