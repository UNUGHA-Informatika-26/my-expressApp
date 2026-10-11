import { StyleSheet, Text, View } from 'react-native';
import { formatRupiah } from '../../lib/format';

/**
 * Bar progres pembayaran hutang.
 * `ratio` dibatasi 0..1 supaya bar tidak pernah keluar dari track,
 * dan `done` mengubah warna menjadi hijau ketika lunas.
 */
export function ProgressBar({
  paid,
  total,
  ratio,
  done,
  height = 8,
}: {
  paid: number;
  total: number;
  /** 0..1, sudah dibatasi oleh pemanggil. */
  ratio: number;
  done: boolean;
  /** Tinggi bar dalam pixel; 8 untuk kartu, lebih tebal untuk detail. */
  height?: number;
}) {
  return (
    <View>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            { width: `${ratio * 100}%` },
            done ? styles.fillDone : null,
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        Terbayar {formatRupiah(paid)} dari {formatRupiah(total)}
        {total > 0 ? ` (${Math.round(ratio * 100)}%)` : ''}
      </Text>
    </View>
  );
}

/** Persentase pembayaran yang sudah dibatasi 0..1. */
export function paymentRatio(paid: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, paid / total));
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginTop: 10,
  },
  fill: { height: '100%', borderRadius: 4, backgroundColor: '#2563EB' },
  fillDone: { backgroundColor: '#059669' },
  progressText: { fontSize: 12, color: '#6B7280', marginTop: 6 },
});
