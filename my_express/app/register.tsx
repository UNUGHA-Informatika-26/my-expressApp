import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { register as registerApi } from '../features/auth/api';
import { registerSchema, type RegisterValues } from '../features/auth/validation';
import { getErrorMessage } from '../lib/api';
import { useAuthStore } from '../store/auth';

export default function RegisterScreen() {
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm<RegisterValues>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (response) => {
      setSession(response.data.token, response.data.user);
      router.replace('/(tabs)');
    },
    onError: (error) => {
      Alert.alert('Pendaftaran gagal', getErrorMessage(error));
    },
  });

  const onSubmit = (values: RegisterValues) => {
    // Validasi manual dengan zod (tanpa @hookform/resolvers).
    const result = registerSchema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        form.setError(issue.path.join('.') as keyof RegisterValues, { message: issue.message });
      }
      return;
    }
    registerMutation.mutate(result.data);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Buat Akun</Text>
          <Text style={styles.subtitle}>Daftar untuk mulai mencatat penjualan</Text>
        </View>

        <Controller
          control={form.control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nama Lengkap"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Nama Anda"
              error={form.formState.errors.name?.message}
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
              autoComplete="email"
              placeholder="contoh@tokokita.com"
              error={form.formState.errors.email?.message}
            />
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Kata Sandi"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              placeholder="Minimal 8 karakter, huruf dan angka"
              error={form.formState.errors.password?.message}
            />
          )}
        />

        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Ulangi Kata Sandi"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              placeholder="Ketik ulang kata sandi"
              error={form.formState.errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          label="Daftar"
          onPress={form.handleSubmit(onSubmit)}
          loading={registerMutation.isPending}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sudah punya akun? </Text>
          <Link href="/login" style={styles.footerLink}>
            Masuk di sini
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#2563EB' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 15, color: '#6B7280' },
  footerLink: { fontSize: 15, color: '#2563EB', fontWeight: '600' },
});
