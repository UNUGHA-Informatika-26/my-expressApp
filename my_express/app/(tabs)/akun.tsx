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
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
});
