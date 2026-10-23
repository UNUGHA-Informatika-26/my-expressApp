import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import {
  deleteProfile,
  getProfile,
  updateProfile,
} from '../../features/auth/api';
import {
  updateProfileSchema,
  type UpdateProfileValues,
} from '../../features/auth/validation';
import { NotificationSettings } from '../../features/notifications/NotificationSettings';
import { TabHeaderTitle } from '../../features/tabs/TabHeaderTitle';
import { getErrorMessage } from '../../lib/api';
import { navy, text } from '../../lib/theme';
import { useAuthStore } from '../../store/auth';

export default function AkunScreen() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);

  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  // Konfirmasi hapus akun sengaja dibuat langkah terpisah, bukan sekadar
  // dialog: pengguna harus membuka panelnya sendiri lalu mengetik ulang kata
  // sandi, sehingga tombol merah tidak bisa tertekan tanpa sengaja.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Ambil profil terbaru dari server (bukan dari cache Zustand).
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  // Sinkronkan profil terbaru ke store (useEffect, karena TanStack v5
  // tidak lagi menyediakan onSuccess di useQuery).
  const profileData = profileQuery.data;
  useEffect(() => {
    if (profileData) {
      setUser(profileData);
    }
  }, [profileData, setUser]);

  const form = useForm<UpdateProfileValues>({
    defaultValues: {
      name: user?.name ?? '',
      storeName: user?.storeName ?? null,
      email: user?.email ?? '',
      phone: user?.phone ?? null,
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(['profile'], data);
      setEditing(false);
      Alert.alert('Berhasil', 'Profil Anda sudah diperbarui.');
    },
    onError: (error) => {
      Alert.alert('Gagal memperbarui profil', getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      // Seluruh data yang di-cache berasal dari akun yang baru saja dihapus,
      // jadi harus ikut dibuang; kalau tidak, pengguna berikutnya yang masuk
      // bisa sempat melihat sisa datanya.
      clearSession();
      queryClient.clear();
      router.replace('/login');
    },
    onError: (error) => {
      // 401 = kata sandi salah. Pesannya ditaruh di bawah kolom sandi, bukan
      // dialog, supaya pengguna bisa langsung membetulkan.
      setDeleteError(getErrorMessage(error));
    },
  });

  const onSubmit = (values: UpdateProfileValues) => {
    // Validasi manual dengan zod (tanpa @hookform/resolvers).
    const result = updateProfileSchema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        form.setError(issue.path.join('.') as keyof UpdateProfileValues, {
          message: issue.message,
        });
      }
      return;
    }
    updateMutation.mutate(result.data);
  };

  const onCancelEdit = () => {
    form.reset({
      name: user?.name ?? '',
      storeName: user?.storeName ?? null,
      email: user?.email ?? '',
      phone: user?.phone ?? null,
    });
    setEditing(false);
  };

  const onLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: () => {
          clearSession();
          router.replace('/login');
        },
      },
    ]);
  };

  const onCancelDelete = () => {
    setConfirmingDelete(false);
    setDeletePassword('');
    setDeleteError(null);
    deleteMutation.reset();
  };

  const onConfirmDelete = () => {
    if (!deletePassword.trim()) {
      setDeleteError('Kata sandi wajib diisi');
      return;
    }
    setDeleteError(null);
    // Server yang memutuskan: bila sandi salah, 401 dikembalikan dan tidak
    // ada satu pun baris yang sempat disentuh.
    deleteMutation.mutate(deletePassword.trim());
  };

  if (profileQuery.isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Memuat profil...</Text>
      </View>
    );
  }

  if (profileQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{getErrorMessage(profileQuery.error)}</Text>
        <Button label="Coba lagi" onPress={() => profileQuery.refetch()} />
        {/*
          Tombol keluar ini WAJIB ada di cabang error, bukan cuma di layar utama.
          Cabang error menggantikan SELURUH isi layar, jadi tanpa tombol ini
          pengguna yang akunnya sudah tidak ada (misalnya sesi lama setelah akun
          dihapus) terkunci total: tidak bisa keluar, tidak bisa mendaftar ulang.
          "Coba lagi" pun tidak akan pernah membaik karena masalahnya bukan
          jaringan — akunnya memang sudah tidak ada.
        */}
        <Button label="Keluar" onPress={onLogout} variant="danger" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Tabs.Screen
        options={{
          headerTitle: () => (
            <TabHeaderTitle
              title="Akun"
              // Nama toko tidak pernah diisi saat pendaftaran, jadi nama
              // pemilik dipakai sebagai cadangan agar barisnya tidak kosong.
              subtitle={user?.storeName || user?.name || 'Akun'}
            />
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={text.cardTitle}>Profil</Text>

          {!editing ? (
            <View>
              <Field label="Nama Lengkap" value={user?.name ?? '-'} />
              <Field label="Nama Toko" value={user?.storeName || '-'} />
              <Field label="Email" value={user?.email ?? '-'} />
              <Field label="Nomor Telepon" value={user?.phone || '-'} />
              <Button label="Edit Profil" onPress={() => setEditing(true)} />
            </View>
          ) : (
            <View>
              <Controller
                control={form.control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Nama Lengkap"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={form.formState.errors.name?.message}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="storeName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Nama Toko"
                    value={value ?? ''}
                    onChangeText={(text) => onChange(text.length ? text : null)}
                    onBlur={onBlur}
                    placeholder="Opsional"
                    error={form.formState.errors.storeName?.message}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={form.formState.errors.email?.message}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Nomor Telepon"
                    value={value ?? ''}
                    onChangeText={(text) => onChange(text.length ? text : null)}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                    placeholder="Opsional"
                    error={form.formState.errors.phone?.message}
                  />
                )}
              />
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Button label="Batal" onPress={onCancelEdit} variant="danger" />
                </View>
                <View style={styles.rowItem}>
                  <Button
                    label="Simpan"
                    onPress={form.handleSubmit(onSubmit)}
                    loading={updateMutation.isPending}
                  />
                </View>
              </View>
            </View>
          )}
        </Card>

        <NotificationSettings />

        <Button label="Keluar" onPress={onLogout} variant="danger" />

        {confirmingDelete ? (
          <Card>
            <Text style={text.cardTitle}>Hapus Akun</Text>
            <Text style={styles.warning}>
              Seluruh data toko Anda — produk, riwayat transaksi, distributor, dan
              hutang — akan terhapus permanen. Tindakan ini tidak bisa dibatalkan.
            </Text>
            <Input
              label="Kata Sandi"
              value={deletePassword}
              onChangeText={(value) => {
                setDeletePassword(value);
                // Hilangkan pesan error begitu pengguna mulai membetulkan.
                if (deleteError) setDeleteError(null);
              }}
              secureTextEntry
              autoComplete="password"
              placeholder="Ketik ulang kata sandi Anda"
              error={deleteError ?? undefined}
            />
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Button label="Batal" onPress={onCancelDelete} variant="outline" />
              </View>
              <View style={styles.rowItem}>
                <Button
                  label="Hapus Permanen"
                  onPress={onConfirmDelete}
                  variant="danger"
                  loading={deleteMutation.isPending}
                />
              </View>
            </View>
          </Card>
        ) : (
          <Button
            label="Hapus Akun"
            onPress={() => setConfirmingDelete(true)}
            variant="outline"
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: navy.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: navy.background, padding: 24, gap: 16 },
  container: { padding: 16 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  fieldValue: { fontSize: 16, color: '#111827', fontWeight: '500' },
  muted: { fontSize: 15, color: '#6B7280' },
  warning: { fontSize: 14, color: '#B91C1C', lineHeight: 20, marginBottom: 16 },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
});
