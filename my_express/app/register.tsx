import Feather from '@expo/vector-icons/Feather';
import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { register as registerApi } from '../features/auth/api';
import { registerSchema, type RegisterValues } from '../features/auth/validation';
import { getErrorMessage } from '../lib/api';
import { auth } from '../lib/theme';

export default function RegisterScreen() {
  // Keadaan TAMPILAN saja: apakah kata sandi sedang terlihat. Tidak menyentuh
  // isi formulir, jadi validasi lama tetap bekerja seperti biasa.
  const [sandiTampil, setSandiTampil] = useState(false);
  const [konfirmasiTampil, setKonfirmasiTampil] = useState(false);

  const form = useForm<RegisterValues>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (response) => {
      // Pendaftaran TIDAK membentuk sesi. Alurnya wajib daftar → login → beranda,
      // jadi token yang dikirim server (auth.controller.ts baris 33) sengaja
      // dibiarkan begitu saja dan pengguna diminta masuk lewat Layar Login.
      //
      // dismissTo, bukan replace: layar Daftar selalu dibuka dari Layar Login,
      // jadi dismissTo menutup layar Daftar dan kembali ke instance Login yang
      // asli — replace akan menyisakan Login ganda di tumpukan sehingga tombol
      // kembali tampak macet. Bila Daftar dibuka langsung tanpa Login di
      // belakangnya, dismissTo otomatis jatuh ke replace (lihat router.d.ts:64).
      router.dismissTo({ pathname: '/login', params: { email: response.data.user.email } });

      // Ditekan sesudah navigasi supaya pengguna membaca pesannya sambil melihat
      // Layar Login yang sudah siap diisi.
      Alert.alert('Pendaftaran berhasil', 'Silakan masuk dengan email dan kata sandi Anda.');
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
    <View style={styles.page}>
      {/* Garis biru tipis di puncak layar, sesuai gambar desain. */}
      <View style={styles.accentBar} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="light" />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            {/* Baris merek */}
            <View style={styles.brandRow}>
              <View style={styles.brandBox}>
                <Feather name="box" size={18} color={auth.colors.textInverse} />
              </View>
              <Text style={styles.brandText}>INVENTARIS</Text>
            </View>

            <Text style={styles.title}>Usaha rapi, mulai di sini.</Text>
            <Text style={styles.subtitle}>Kelola stok dan penjualan dalam satu aplikasi.</Text>

            {/* Kartu formulir */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Buat akun</Text>
              <Text style={styles.cardSubtitle}>Lengkapi data Anda untuk memulai.</Text>

              <View style={styles.fields}>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      variant="auth"
                      leftIcon="user"
                      label="Nama lengkap"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Masukkan nama lengkap"
                      error={form.formState.errors.name?.message}
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      variant="auth"
                      leftIcon="mail"
                      label="Email"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      placeholder="nama@email.com"
                      error={form.formState.errors.email?.message}
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      variant="auth"
                      leftIcon="lock"
                      rightIcon={sandiTampil ? 'eye' : 'eye-off'}
                      onRightIconPress={() => setSandiTampil((sebelumnya) => !sebelumnya)}
                      secureTextEntry={!sandiTampil}
                      // Merapatkan kolom ke teks bantuan di bawahnya.
                      containerStyle={styles.sandiRapat}
                      label="Kata sandi"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Buat kata sandi"
                      error={form.formState.errors.password?.message}
                    />
                  )}
                />
                <Text style={styles.helper}>Minimal 8 karakter, gunakan huruf dan angka.</Text>

                <Controller
                  control={form.control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      variant="auth"
                      leftIcon="lock"
                      rightIcon={konfirmasiTampil ? 'eye' : 'eye-off'}
                      onRightIconPress={() => setKonfirmasiTampil((sebelumnya) => !sebelumnya)}
                      secureTextEntry={!konfirmasiTampil}
                      containerStyle={styles.konfirmasiJarak}
                      label="Konfirmasi kata sandi"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ulangi kata sandi"
                      error={form.formState.errors.confirmPassword?.message}
                    />
                  )}
                />
              </View>

              {/* Kedua frasa biru tebal mengikuti gambar desain. Tujuannya belum
                  ada di spesifikasi dan penambahan rute baru dilarang, jadi
                  frasa ini belum bisa ditekan — lihat catatan laporan. */}
              <Text style={styles.consent}>
                Dengan mendaftar, Anda menyetujui{' '}
                <Text style={styles.consentLink}>Syarat &amp; Ketentuan</Text> serta{' '}
                <Text style={styles.consentLink}>Kebijakan Privasi</Text> kami.
              </Text>

              <View style={styles.actions}>
                <Button
                  variant="auth"
                  label="Daftar"
                  onPress={form.handleSubmit(onSubmit)}
                  loading={registerMutation.isPending}
                />
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Sudah memiliki akun? </Text>
              <Link href="/login" style={styles.footerLink}>
                Masuk
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: auth.colors.background },
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: auth.colors.background },
  accentBar: { height: 3, backgroundColor: auth.colors.primary },
  container: {
    flexGrow: 1,
    paddingHorizontal: auth.spacing.screenPadding,
    paddingVertical: auth.spacing.blockGap,
  },

  // --- Di atas kartu ---
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: auth.spacing.brandGap },
  brandBox: {
    width: auth.spacing.brandBox,
    height: auth.spacing.brandBox,
    borderRadius: auth.radius.brandBox,
    backgroundColor: auth.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: auth.fontFamily.bold,
    fontSize: auth.fontSize.brand,
    color: auth.colors.textInverse,
    letterSpacing: auth.letterSpacing.brand,
  },
  title: {
    marginTop: auth.spacing.blockGap,
    fontFamily: auth.fontFamily.extraBold,
    fontSize: auth.fontSize.hero,
    color: auth.colors.textInverse,
  },
  subtitle: {
    marginTop: auth.spacing.labelGap,
    fontFamily: auth.fontFamily.regular,
    fontSize: auth.fontSize.small,
    color: auth.colors.onDarkMuted,
  },

  // --- Kartu formulir ---
  card: {
    marginTop: auth.spacing.subtitleGap,
    backgroundColor: auth.colors.surface,
    borderRadius: auth.radius.card,
    padding: auth.spacing.cardPadding,
  },
  cardTitle: {
    fontFamily: auth.fontFamily.extraBold,
    fontSize: auth.fontSize.cardTitle,
    color: auth.colors.text,
  },
  cardSubtitle: {
    marginTop: auth.spacing.titleGap,
    fontFamily: auth.fontFamily.regular,
    fontSize: auth.fontSize.small,
    color: auth.colors.textSecondary,
  },
  fields: { marginTop: auth.spacing.formGap },
  /** Kolom kata sandi menempel ke teks bantuan di bawahnya. */
  sandiRapat: { marginBottom: auth.spacing.helperGap },
  /** Jarak kecil pemisah teks bantuan dan kolom konfirmasi. */
  konfirmasiJarak: {
    marginTop: auth.spacing.helperGap,
    marginBottom: auth.spacing.fieldGap,
  },
  helper: {
    fontFamily: auth.fontFamily.regular,
    fontSize: auth.fontSize.helper,
    color: auth.colors.textSecondary,
  },
  consent: {
    marginTop: auth.spacing.fieldGap,
    fontFamily: auth.fontFamily.regular,
    fontSize: auth.fontSize.helper,
    lineHeight: 16,
    color: auth.colors.textSecondary,
  },
  consentLink: {
    fontFamily: auth.fontFamily.bold,
    color: auth.colors.primary,
  },
  actions: { marginTop: auth.spacing.fieldGap },

  // --- Di bawah kartu ---
  footer: {
    marginTop: auth.spacing.footerGap,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: auth.fontFamily.regular,
    fontSize: auth.fontSize.input,
    color: auth.colors.onDarkMuted,
  },
  footerLink: {
    fontFamily: auth.fontFamily.bold,
    fontSize: auth.fontSize.input,
    color: auth.colors.textInverse,
    textDecorationLine: 'underline',
  },
});
