import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { formatShortDate } from '../../lib/date';
import { formatRupiah } from '../../lib/format';
import type { Debt } from '../../types/api';
import { paymentRatio, ProgressBar } from './ProgressBar';

/** Badge status: Lunas, Lewat tempo, atau Jatuh tempo. */
function StatusBadge({ debt }: { debt: Debt }) {
  if (debt.status === 'lunas') {
    return (
      <View style={[styles.badge, styles.badgeLunas]}>
        <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
        <Text style={styles.badgeText}>Lunas</Text>
      </View>
    );
  }
  if (debt.isOverdue) {
    return (
      <View style={[styles.badge, styles.badgeOverdue]}>
        <Ionicons name="alert-circle" size={13} color="#FFFFFF" />
        <Text style={styles.badgeText}>Lewat tempo</Text>
      </View>
    );
  }
  if (debt.isDueSoon) {
    return (
      <View style={[styles.badge, styles.badgeSoon]}>
        <Ionicons name="time" size={13} color="#FFFFFF" />
        <Text style={styles.badgeText}>Jatuh tempo</Text>
      </View>
    );
  }
  return null;
}

/**
 * Kartu satu tagihan hutang (tugas Fase 7):
 * nama distributor, nomor faktur, sisa hutang, progres pembayaran,
 * dan tanggal jatuh tempo.
 */
export function DebtCard({ debt, onPress }: { debt: Debt; onPress?: () => void }) {
  const ratio = paymentRatio(debt.paidAmount, debt.totalAmount);
  const isDone = debt.status === 'lunas';

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Tagihan ${debt.distributorName ?? 'Tanpa nama'}`}
    >
      <View style={styles.header}>
        <Text style={styles.distributor} numberOfLines={1}>
          {debt.distributorName ?? 'Tanpa nama'}
        </Text>
        <StatusBadge debt={debt} />
      </View>

      <Text style={styles.invoice}>Faktur {debt.invoiceNumber}</Text>

      <View style={styles.amountRow}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Sisa hutang</Text>
          <Text style={[styles.amountValue, isDone && styles.amountDone]}>
            {formatRupiah(debt.remaining)}
          </Text>
        </View>
        <View style={styles.amountBoxRight}>
          <Text style={styles.amountLabelRight}>Total</Text>
          <Text style={styles.amountTotal}>{formatRupiah(debt.totalAmount)}</Text>
        </View>
      </View>

      {/* Progres pembayaran: berapa persen total yang sudah terbayar. */}
      <ProgressBar
        paid={debt.paidAmount}
        total={debt.totalAmount}
        ratio={ratio}
        done={isDone}
      />

      <View style={styles.footer}>
        <Ionicons
          name="calendar-outline"
          size={14}
          color={debt.isOverdue && !isDone ? '#DC2626' : '#6B7280'}
        />
        <Text style={[styles.dueDate, debt.isOverdue && !isDone ? styles.dueDateOverdue : null]}>
          Jatuh tempo {formatShortDate(debt.dueDate)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distributor: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  invoice: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 12 },
  amountBox: { flex: 1 },
  amountBoxRight: { alignItems: 'flex-end' },
  amountLabel: { fontSize: 12, color: '#6B7280' },
  amountLabelRight: { fontSize: 12, color: '#6B7280' },
  amountValue: { fontSize: 20, fontWeight: '800', color: '#DC2626', marginTop: 2 },
  amountDone: { color: '#059669' },
  amountTotal: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  dueDate: { fontSize: 13, color: '#6B7280' },
  dueDateOverdue: { color: '#DC2626', fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeLunas: { backgroundColor: '#059669' },
  badgeOverdue: { backgroundColor: '#DC2626' },
  badgeSoon: { backgroundColor: '#D97706' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
});
