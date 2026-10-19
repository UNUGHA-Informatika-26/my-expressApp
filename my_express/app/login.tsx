import { useMutation } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { login } from '../features/auth/api';
import { loginSchema, type LoginValues } from '../features/auth/validation';
import { getErrorMessage } from '../lib/api';
import { navy } from '../lib/theme';
import { useAuthStore } from '../store/auth';

export default function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);

  // Email yang baru didaftarkan di Layar Daftar, dilewatkan sebagai parameter rute.
  const { email } = useLocalSearchParams<{ email?: string }>();

  const form = useForm<LoginValues>({
    defaultValues: { email: '', password: '' },
  });
  const { setValue, getValues } = form;

  // `defaultValues` tidak dipakai untuk menerima email itu: Layar Login sudah
  // ter-mount jauh sebelum pengguna menekan tombol Daftar, jadi nilai awal
  // tidak pernah dibaca ulang. Param rute yang berubah itulah pemicunya.
  useEffect(() => {
    // Ditulis hanya bila nilainya berbeda, supaya efek ini idempoten dan tidak
    // pernah menimbulkan render ulang yang tak berujung.
    if (email && getValues('email') !== email) {
      setValue('email', email);
    }
  }, [email, setValue, getValues]);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      setSession(response.data.token, response.data.user);
      router.replace('/(tabs)');
    },
    onError: (error) => {
      Alert.alert('Login gagal', getErrorMessage(error));
    },
  });

  const onSubmit = (values: LoginValues) => {
    // Validasi manual dengan zod (tanpa @hookform/resolvers).
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        form.setError(issue.path.join('.') as keyof LoginValues, { message: issue.message });
      }
      return;
    }
    loginMutation.mutate(result.data);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>my_express</Text>
          <Text style={styles.subtitle}>Masuk untuk mengelola toko ATK Anda</Text>
        </View>

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
              autoComplete="password"
              placeholder="Kata sandi Anda"
              error={form.formState.errors.password?.message}
            />
          )}
        />

        <Button
          label="Masuk"
          onPress={form.handleSubmit(onSubmit)}
          loading={loginMutation.isPending}
        />

        {/* Lupa kata sandi hanya tautan tampilan (luar cakupan pengiriman email). */}
        <Text style={styles.hint}>Lupa kata sandi? Hubungi admin toko.</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Belum punya akun? </Text>
          <Link href="/register" style={styles.footerLink}>
            Daftar di sini
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: navy.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: navy.main },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  hint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 15, color: '#6B7280' },
  footerLink: { fontSize: 15, color: navy.main, fontWeight: '600' },
});
