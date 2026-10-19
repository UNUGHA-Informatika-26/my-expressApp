import Feather from '@expo/vector-icons/Feather';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { auth } from '../lib/theme';

/** Nama ikon Feather yang valid — mencegah salah ketik nama ikon. */
type FeatherName = keyof typeof Feather.glyphMap;

interface Props extends TextInputProps {
  label: string;
  /** Pesan error validasi; jika ada, kolom berwarna merah dan pesan tampil. */
  error?: string;
  /** Ikon Feather di kiri kolom, misalnya `user` atau `mail`. */
  leftIcon?: FeatherName;
  /**
   * Ikon Feather di kanan kolom. Dipakai untuk tombol mata pada kolom kata
   * sandi. Tanpa `onRightIconPress`, ikon hanya tampil sebagai hiasan.
   */
  rightIcon?: FeatherName;
  /** Membuat ikon kanan bisa ditekan, misalnya untuk membalik tampil kata sandi. */
  onRightIconPress?: () => void;
  /**
   * Gaya kolom.
   * - `default`: gaya lama aplikasi — putih bergaris abu. Dipakai layar lain.
   * - `auth`: latar biru sangat muda khas layar Daftar dan Masuk.
   *
   * Nilai awal `default`, sehingga layar yang tidak menyebut `variant` tampil
   * persis seperti sebelum properti ini ada.
   */
  variant?: 'default' | 'auth';
  /**
   * Gaya untuk WADAH kolom, bukan kolomnya sendiri. Dipakai layar untuk
   * mengatur jaraknya sendiri, misalnya merapatkan kolom kata sandi ke teks
   * bantuan di bawahnya.
   */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Kolom teks berlabel dengan pesan error, ikon opsional di kiri, dan ikon kanan
 * yang bisa ditekan.
 */
export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, style, leftIcon, rightIcon, onRightIconPress, variant = 'default', containerStyle, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const isAuth = variant === 'auth';

  // Gaya kolom isian mengikuti status: fokus diutamakan, lalu error.
  const authShell = [
    authStyles.inputRow,
    focused && authStyles.inputRowFocused,
    !focused && error ? authStyles.inputRowError : null,
  ];

  // Tanpa ikon sama sekali, kolom tetap dirender apa adanya seperti dulu —
  // penambahan pembungkus baris akan menggeser tampilan layar lain.
  const hasIcons = Boolean(leftIcon || rightIcon);

  const field = (
    <TextInput
      {...inputProps}
      ref={ref}
      // Pemanggil boleh mengeset onFocus/onBlur sendiri, jadi handler penanda
      // fokus diletakkan SETELAH spread agar tidak tertimpa.
      onFocus={(event) => {
        setFocused(true);
        inputProps.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        inputProps.onBlur?.(event);
      }}
      placeholderTextColor={isAuth ? auth.colors.placeholder : '#9CA3AF'}
      style={
        isAuth
          ? [authStyles.input, style]
          : [styles.input, error ? styles.inputError : null, style]
      }
    />
  );

  return (
    <View style={[styles.container, isAuth && authStyles.container, containerStyle]}>
      <Text style={[styles.label, isAuth && authStyles.label]}>{label}</Text>

      {isAuth && hasIcons ? (
        <View style={authShell}>
          {leftIcon ? (
            <Feather name={leftIcon} size={18} color={auth.colors.textSecondary} />
          ) : null}

          {field}

          {rightIcon ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={inputProps.secureTextEntry ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'}
              onPress={onRightIconPress}
              hitSlop={8}
            >
              <Feather name={rightIcon} size={18} color={auth.colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      ) : (
        field
      )}

      {error ? (
        <Text style={[styles.error, isAuth && authStyles.error]}>{error}</Text>
      ) : null}
    </View>
  );
});

/**
 * Gaya lama, dipertahankan apa adanya. Kolom ini dipakai bersama oleh enam
 * layar, jadi angkanya tidak diubah agar tampilan mereka ikut tidak berubah.
 * Nilai yang di luar skala tema (13 dan 6) dibiarkan persis seperti semula.
 */
const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: { borderColor: '#DC2626' },
  error: { marginTop: 6, fontSize: 13, color: '#DC2626' },
});

/** Gaya khusus layar daftar-masuk. Semua angka diambil dari `theme.auth`. */
const authStyles = StyleSheet.create({
  container: { marginBottom: auth.spacing.fieldGap },
  label: {
    fontSize: auth.fontSize.small,
    fontWeight: auth.fontWeight.bold,
    color: auth.colors.text,
    marginBottom: auth.spacing.labelGap,
  },
  inputRow: {
    height: auth.spacing.inputHeight,
    borderRadius: auth.radius.input,
    borderWidth: 1,
    borderColor: auth.colors.inputBorder,
    backgroundColor: auth.colors.inputBackground,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: auth.spacing.iconGap,
  },
  inputRowFocused: { borderColor: auth.colors.primary },
  inputRowError: { borderColor: auth.colors.error },
  input: {
    flex: 1,
    padding: 0,
    fontSize: auth.fontSize.input,
    color: auth.colors.text,
  },
  error: {
    marginTop: auth.spacing.helperGap,
    fontSize: auth.fontSize.small,
    color: auth.colors.error,
  },
});
