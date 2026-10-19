import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useCreateDebt, useCreateDistributor, useDistributors } from '../../features/debt/queries';
import {
  debtFormSchema,
  distributorFormSchema,
  fieldErrors,
  type CreateDebtPayload,
  type DebtFormValues,
  type DistributorFormValues,
} from '../../features/debt/validation';
import { getErrorMessage } from '../../lib/api';
import { navy } from '../../lib/theme';
import type { Distributor } from '../../types/api';

/** Tombol cepat menetapkan jatuh tempo beberapa hari ke depan. */
const QUICK_DUE: { label: string; days: number }[] = [
  { label: '+7 hari', days: 7 },
  { label: '+14 hari', days: 14 },
  { label: '+30 hari', days: 30 },
];

const EMPTY_DEBT_FORM: DebtFormValues = {
  distributorId: '',
  invoiceNumber: '',
  totalAmount: '',
  dueDate: '',
};

const EMPTY_DISTRIBUTOR_FORM: DistributorFormValues = { name: '', phone: '' };

/**
 * Layar Tambah Hutang (tugas Fase 7).
 * Pengguna memilih distributor (atau menambah baru di tempat), lalu mengisi
 * nomor faktur, total, dan tanggal jatuh tempo.
 */
export default function TambahHutangScreen() {
  const distributorsQuery = useDistributors();
  const createDebt = useCreateDebt();

  const [form, setForm] = useState<DebtFormValues>(EMPTY_DEBT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const distributors = distributorsQuery.data ?? [];
  const selected = distributors.find((item) => item.id === form.distributorId) ?? null;

  function update<K extends keyof DebtFormValues>(key: K, value: DebtFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Bersihkan error kolom begitu pengguna mengetik ulang.
    setErrors((prev) => {
      if (prev[key as string] === undefined) {
        return prev;
      }
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function setDueDateInDays(days: number) {
    update('dueDate', dayjs().add(days, 'day').format('YYYY-MM-DD'));
  }

  function onSubmit() {
    setFormError(null);

    const result = debtFormSchema.safeParse(form);
    if (!result.success) {
      setErrors(fieldErrors(result));
      setFormError('Periksa kembali isian yang ditandai merah.');
      return;
    }

    const payload: CreateDebtPayload = {
      distributorId: result.data.distributorId,
      invoiceNumber: result.data.invoiceNumber,
      totalAmount: Number(result.data.totalAmount),
      dueDate: result.data.dueDate,
    };

    createDebt.mutate(payload, {
      onSuccess: () => router.back(),
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: true, title: 'Tambah Hutang' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {formError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorBoxText}>{formError}</Text>
          </View>
        ) : null}

        {/* Pilih distributor */}
        <Text style={styles.label}>Distributor</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPickerOpen(true)}
          style={[styles.select, errors.distributorId ? styles.selectError : null]}
        >
          <Text style={[styles.selectText, selected ? null : styles.selectPlaceholder]}>
            {selected ? selected.name : 'Pilih distributor'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </Pressable>
        {errors.distributorId ? <Text style={styles.error}>{errors.distributorId}</Text> : null}

        <Input
          label="Nomor faktur"
          value={form.invoiceNumber}
          onChangeText={(value) => update('invoiceNumber', value)}
          placeholder="Contoh: INV-2026-001"
          autoCapitalize="characters"
          error={errors.invoiceNumber}
        />

        <Input
          label="Total hutang (Rp)"
          value={form.totalAmount}
          onChangeText={(value) => update('totalAmount', value.replace(/[^\d]/g, ''))}
          placeholder="Contoh: 150000"
          keyboardType="number-pad"
          error={errors.totalAmount}
        />

        {/* Tanggal jatuh tempo: teks + tombol cepat (tanpa library date picker). */}
        <Input
          label="Tanggal jatuh tempo"
          value={form.dueDate}
          onChangeText={(value) => update('dueDate', value)}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          error={errors.dueDate}
        />
        <View style={styles.quickRow}>
          {QUICK_DUE.map((item) => (
            <Pressable
              key={item.days}
              accessibilityRole="button"
              onPress={() => setDueDateInDays(item.days)}
              style={({ pressed }) => [styles.quickChip, pressed && styles.pressed]}
            >
              <Text style={styles.quickText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.submit}>
          <Button
            label="Simpan hutang"
            onPress={onSubmit}
            loading={createDebt.isPending}
            disabled={createDebt.isPending}
          />
        </View>
      </ScrollView>

      <DistributorPicker
        visible={pickerOpen}
        distributors={distributors}
        loading={distributorsQuery.isLoading}
        error={distributorsQuery.error ? getErrorMessage(distributorsQuery.error) : null}
        onRetry={() => distributorsQuery.refetch()}
        onSelect={(item) => {
          update('distributorId', item.id);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

/**
 * Dialog memilih distributor, lengkap dengan form tambah distributor baru
 * agar pengguna tidak perlu berpindah layar saat distributor belum terdaftar.
 */
function DistributorPicker({
  visible,
  distributors,
  loading,
  error,
  onRetry,
  onSelect,
  onClose,
}: {
  visible: boolean;
  distributors: Distributor[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (item: Distributor) => void;
  onClose: () => void;
}) {
  const createDistributor = useCreateDistributor();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<DistributorFormValues>(EMPTY_DISTRIBUTOR_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function resetAddForm() {
    setForm(EMPTY_DISTRIBUTOR_FORM);
    setErrors({});
    setFormError(null);
    setShowAddForm(false);
  }

  function onAddDistributor() {
    setFormError(null);

    const result = distributorFormSchema.safeParse(form);
    if (!result.success) {
      setErrors(fieldErrors(result));
      return;
    }

    createDistributor.mutate(result.data, {
      onSuccess: (created) => {
        resetAddForm();
        onSelect(created);
      },
      onError: (err) => setFormError(getErrorMessage(err)),
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pilih distributor</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          {!showAddForm ? (
            <>
              {loading ? (
                <Text style={styles.modalMuted}>Memuat distributor...</Text>
              ) : error ? (
                <View style={styles.modalErrorWrap}>
                  <Text style={styles.error}>{error}</Text>
                  <Button label="Coba lagi" onPress={onRetry} />
                </View>
              ) : (
                <FlatList
                  data={distributors}
                  keyExtractor={(item) => item.id}
                  style={styles.modalList}
                  renderItem={({ item }) => (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onSelect(item)}
                      style={({ pressed }) => [styles.distributorRow, pressed && styles.pressed]}
                    >
                      <Ionicons name="business-outline" size={18} color="#6B7280" />
                      <View style={styles.distributorInfo}>
                        <Text style={styles.distributorName}>{item.name}</Text>
                        {item.phone ? (
                          <Text style={styles.distributorPhone}>{item.phone}</Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.modalMuted}>
                      Belum ada distributor. Tambahkan yang baru.
                    </Text>
                  }
                />
              )}

              <View style={styles.modalFooter}>
                <Button label="Tambah distributor baru" onPress={() => setShowAddForm(true)} />
              </View>
            </>
          ) : (
            <ScrollView contentContainerStyle={styles.addForm} keyboardShouldPersistTaps="handled">
              {formError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorBoxText}>{formError}</Text>
                </View>
              ) : null}

              <Input
                label="Nama distributor"
                value={form.name}
                onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                placeholder="Contoh: CV Sumber ATK"
                error={errors.name}
              />
              <Input
                label="Nomor telepon (opsional)"
                value={form.phone}
                onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                placeholder="Contoh: 08123456789"
                keyboardType="phone-pad"
                error={errors.phone}
              />

              <Button
                label="Simpan distributor"
                onPress={onAddDistributor}
                loading={createDistributor.isPending}
                disabled={createDistributor.isPending}
              />
              <View style={styles.cancelWrap}>
                <Button label="Batal" onPress={resetAddForm} variant="danger" />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: navy.background },
  content: { padding: 16, paddingBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 6 },
  select: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  selectError: { borderColor: '#DC2626' },
  selectText: { flex: 1, fontSize: 16, color: '#111827' },
  selectPlaceholder: { color: '#9CA3AF' },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: -6, marginBottom: 8 },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  quickText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  pressed: { opacity: 0.7 },
  submit: { marginTop: 12 },
  error: { fontSize: 13, color: '#DC2626', marginBottom: 8 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  errorBoxText: { flex: 1, fontSize: 13, color: '#DC2626' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  modalList: { flexGrow: 0 },
  modalMuted: { fontSize: 14, color: '#6B7280', paddingVertical: 16, textAlign: 'center' },
  modalErrorWrap: { gap: 12, paddingVertical: 16 },
  modalFooter: { marginTop: 16 },
  addForm: { paddingVertical: 8 },
  cancelWrap: { marginTop: 10 },
  distributorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  distributorInfo: { flex: 1 },
  distributorName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  distributorPhone: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
