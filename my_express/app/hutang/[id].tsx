import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { paymentRatio, ProgressBar } from '../../features/debt/ProgressBar';
import { useDebt, usePayDebt } from '../../features/debt/queries';
import {
  fieldErrors,
  paymentFormSchema,
  type PayDebtPayload,
  type PaymentFormValues,
} from '../../features/debt/validation';
import { getErrorMessage } from '../../lib/api';
import { formatClock, formatShortDate } from '../../lib/date';
import { formatRupiah } from '../../lib/format';
import type { DebtDetail, DebtPayment } from '../../types/api';

const EMPTY_PAYMENT_FORM: PaymentFormValues = { amount: '', note: '' };

/**
 * Layar Detail Hutang (tugas Fase 7).
 * Menampilkan rincian tagihan, progres pembayaran, riwayat pembayaran,
 * dan form untuk mencatat pelunasan.
 */
export default function DetailHutangScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? '';

  const debtQuery = useDebt(id);
  const payDebt = usePayDebt(id);

  const [form, setForm] = useState<PaymentFormValues>(EMPTY_PAYMENT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof PaymentFormValues>(key: K, value: PaymentFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (prev[key] === undefined) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function onSubmitPayment() {
    setFormError(null);

    const result = paymentFormSchema.safeParse(form);
    if (!result.success) {
      setErrors(fieldErrors(result));
      setFormError('Periksa kembali isian yang ditandai merah.');
      return;
    }

    const payload: PayDebtPayload = {
      amount: Number(result.data.amount),
      note: result.data.note?.trim() ? result.data.note.trim() : undefined,
    };

    payDebt.mutate(payload, {
      // Form dikosongkan; daftar dan detail diambil ulang oleh invalidateQueries.
      onSuccess: () => setForm(EMPTY_PAYMENT_FORM),
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  }

  if (debtQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{getErrorMessage(debtQuery.error)}</Text>
        <Button label="Coba lagi" onPress={() => debtQuery.refetch()} />
      </View>
    );
  }

  // Guard `!data` sekaligus menutup status loading dan men-narrow tipe.
  const debt = debtQuery.data;
  if (!debt) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Memuat detail hutang...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: true, title: 'Detail Hutang' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <DebtSummaryCard debt={debt} />

        {debt.status === 'belum_lunas' ? (
          <PaymentForm
            remaining={debt.remaining}
            form={form}
            errors={errors}
            formError={formError}
            loading={payDebt.isPending}
            onChange={update}
            onSubmit={onSubmitPayment}
          />
        ) : (
          <Card tone="success" style={styles.lunasRow}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.lunasText}>Hutang ini sudah lunas.</Text>
          </Card>
        )}

        <PaymentHistory payments={debt.payments} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Kartu rincian tagihan: total, terbayar, sisa, jatuh tempo, dan status. */
function DebtSummaryCard({ debt }: { debt: DebtDetail }) {
  const ratio = paymentRatio(debt.paidAmount, debt.totalAmount);
  const isDone = debt.status === 'lunas';

  return (
    <Card>
      <Text style={styles.distributor}>{debt.distributorName ?? 'Tanpa nama'}</Text>
      <Text style={styles.invoice}>Faktur {debt.invoiceNumber}</Text>

      <View style={styles.amountBlock}>
        <Text style={styles.amountLabel}>Sisa hutang</Text>
        <Text style={[styles.amountValue, isDone && styles.amountDone]}>
          {formatRupiah(debt.remaining)}
        </Text>
      </View>

      <ProgressBar
        paid={debt.paidAmount}
        total={debt.totalAmount}
        ratio={ratio}
        done={isDone}
        height={10}
      />

      <View style={styles.detailRows}>
        <Row label="Total hutang" value={formatRupiah(debt.totalAmount)} />
        <Row label="Sudah dibayar" value={formatRupiah(debt.paidAmount)} />
        <Row
          label="Jatuh tempo"
          value={formatShortDate(debt.dueDate)}
          highlight={debt.isOverdue && !isDone}
        />
        <Row label="Status" value={isDone ? 'Lunas' : debt.isOverdue ? 'Lewat tempo' : 'Belum lunas'} />
      </View>
    </Card>
  );
}

/** Form mencatat pembayaran; jumlah maksimal dibatasi sisa hutang di server. */
function PaymentForm({
  remaining,
  form,
  errors,
  formError,
  loading,
  onChange,
  onSubmit,
}: {
  remaining: number;
  form: PaymentFormValues;
  errors: Record<string, string>;
  formError: string | null;
  loading: boolean;
  onChange: <K extends keyof PaymentFormValues>(key: K, value: PaymentFormValues[K]) => void;
  onSubmit: () => void;
}) {
  return (
    <Card>
      <Text style={styles.sectionTitle}>Catat pembayaran</Text>
      <Text style={styles.sectionHint}>Sisa yang bisa dibayar: {formatRupiah(remaining)}</Text>

      {formError ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color="#DC2626" />
          <Text style={styles.errorBoxText}>{formError}</Text>
        </View>
      ) : null}

      <Input
        label="Jumlah pembayaran (Rp)"
        value={form.amount}
        onChangeText={(value) => onChange('amount', value.replace(/[^\d]/g, ''))}
        placeholder="Contoh: 50000"
        keyboardType="number-pad"
        error={errors.amount}
      />
      <Input
        label="Catatan (opsional)"
        value={form.note}
        onChangeText={(value) => onChange('note', value)}
        placeholder="Contoh: bayar tunai"
        error={errors.note}
      />

      <Button label="Catat pembayaran" onPress={onSubmit} loading={loading} disabled={loading} />
    </Card>
  );
}

/** Riwayat pembayaran, terbaru di atas. */
function PaymentHistory({ payments }: { payments: DebtPayment[] }) {
  return (
    <Card>
      <Text style={styles.sectionTitle}>Riwayat pembayaran</Text>

      {payments.length === 0 ? (
        <Text style={styles.mutedLeft}>Belum ada pembayaran.</Text>
      ) : (
        payments.map((payment) => (
          <View key={payment.id} style={styles.paymentRow}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentAmount}>{formatRupiah(payment.amount)}</Text>
              <Text style={styles.paymentMeta}>
                {formatShortDate(payment.paidAt)} · {formatClock(payment.paidAt)}
              </Text>
              {payment.note ? <Text style={styles.paymentNote}>{payment.note}</Text> : null}
            </View>
          </View>
        ))
      )}
    </Card>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight ? styles.rowValueHighlight : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 32 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: '#F9FAFB',
  },
  muted: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  mutedLeft: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  distributor: { fontSize: 18, fontWeight: '800', color: '#111827' },
  invoice: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  amountBlock: { marginTop: 14 },
  amountLabel: { fontSize: 13, color: '#6B7280' },
  amountValue: { fontSize: 28, fontWeight: '800', color: '#DC2626', marginTop: 2 },
  amountDone: { color: '#059669' },
  detailRows: { marginTop: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#111827', flexShrink: 1, textAlign: 'right' },
  rowValueHighlight: { color: '#DC2626', fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sectionHint: { fontSize: 13, color: '#6B7280', marginTop: 2, marginBottom: 12 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorBoxText: { flex: 1, fontSize: 13, color: '#DC2626' },
  /** Susunan isi kartu "sudah lunas"; warna dan garisnya datang dari nada sukses. */
  lunasRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lunasText: { fontSize: 15, fontWeight: '600', color: '#059669' },
  paymentRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingVertical: 10,
    marginTop: 4,
  },
  paymentInfo: { flex: 1 },
  paymentAmount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  paymentMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  paymentNote: { fontSize: 12, color: '#374151', marginTop: 2, fontStyle: 'italic' },
});
