import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { auth, fontSize, fontWeight, navy } from '../lib/theme';

interface Props {
  label: string;
  onPress: () => void;
  /** true: tampilkan spinner dan nonaktifkan tombol. */
  loading?: boolean;
  disabled?: boolean;
  /**
   * Gaya tombol.
   * - `primary`: varian bawaan; gradasi navy seperti kartu penjualan Beranda.
   * - `danger`: merah, untuk tombol keluar dan hapus.
   * - `auth`: biru terang `#1A50E8`, khas tombol Daftar pada layar berlatar
   *   navy. Sengaja TIDAK dibuat navy, sebab tombolnya akan menyatu dengan
   *   latar `#0D1B3E` dan hilang.
   * - `outline`: hanya bergaris navy, tanpa latar — pasangan "Unduh Excel"
   *   di layar Laporan, berdampingan dengan tombol utama yang terisi.
   *
   * Nilai awal `primary`.
   */
  variant?: 'primary' | 'danger' | 'auth' | 'outline';
  /** Teks ikon di sebelah label, bila ingin tombol punya ikon (mis. "✓ ..."). */
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Tombol utama aplikasi dengan status loading bawaan. */
export function Button({ label, onPress, loading = false, disabled = false, variant = 'primary', icon }: Props) {
  const isDisabled = disabled || loading;
  const background =
    variant === 'auth'
      ? authStyles.auth
      : variant === 'danger'
        ? styles.danger
        : variant === 'outline'
          ? outlineStyles.outline
          : styles.primary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        background,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {variant === 'primary' && (
        <LinearGradient
          colors={[navy.main, navy.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? navy.main : '#FFFFFF'} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={variant === 'outline' ? navy.main : '#FFFFFF'}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              variant === 'auth' && authStyles.label,
              variant === 'outline' && outlineStyles.label,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/**
 * Gaya lama, dipertahankan apa adanya kecuali latar varian utama yang kini
 * gradasi navy seperti kartu penjualan di Beranda.
 */
const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  /**
   * Latar datar `#2563EB` dilepas karena gradasi yang menanganinya.
   * `overflow: hidden` memotong gradasi mengikuti sudut membulat —
   * React Native tidak memotong isi anak mengikuti sudut induknya.
   */
  primary: { overflow: 'hidden' },
  danger: { backgroundColor: '#DC2626' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

/** Gaya khusus tombol Daftar. Angka diambil dari `theme.auth`. */
const authStyles = StyleSheet.create({
  auth: {
    backgroundColor: auth.colors.primary,
    borderRadius: auth.radius.button,
    minHeight: auth.spacing.buttonHeight,
  },
  label: {
    fontWeight: auth.fontWeight.bold,
    fontSize: auth.fontSize.button,
    color: auth.colors.textInverse,
  },
});

/**
 * Gaya tombol bergaris navy (tanpa latar).
 *
 * Tinggi dan sudut membulatnya TIDAK ditulis ulang di sini — `styles.base`
 * sudah menentukan keduanya (48 dan 12, sesuai `layout.controlHeight` dan
 * `radius.lg`), sehingga pasangan tombol di sebelahnya berukuran persis sama
 * dan hanya latarnya yang berbeda.
 *
 * Ukuran serta ketebalan huruf memakai token yang nilainya sama dengan label
 * tombol utama (`fontSize.body` 16, `fontWeight.semibold` '600').
 *
 * Latarnya `transparent`, bukan `colors.surface`: tombol ini sengaja dibuat
 * tanpa isian apa pun supaya warnanya mengikuti wadah yang memuatnya.
 */
const outlineStyles = StyleSheet.create({
  outline: {
    borderWidth: 1,
    borderColor: navy.main,
    backgroundColor: 'transparent',
  },
  label: {
    color: navy.main,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
});
