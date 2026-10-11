import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, layout, opacity, radius } from '../lib/theme';

/** Warna latar kartu. `surface` untuk kartu biasa, sisanya untuk penekanan. */
export type CardTone = 'surface' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';

/**
 * Latar dan garis kartu per nada, diambil dari tema supaya tidak ada layar
 * yang menulis warnanya sendiri.
 */
const TONE: Record<CardTone, { backgroundColor: string; borderColor: string }> = {
  surface: { backgroundColor: colors.surface, borderColor: colors.border },
  muted: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
  primary: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  success: { backgroundColor: colors.successSoft, borderColor: colors.successBorder },
  warning: { backgroundColor: colors.warningSoft, borderColor: colors.warningBorder },
  danger: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder },
};

interface Props {
  children: ReactNode;
  /** Warna latar kartu. Default `surface` — putih bergaris tipis. */
  tone?: CardTone;
  /**
   * Beri jarak di bawah kartu (default benar). Matikan bila jaraknya sudah
   * diatur lewat `style`, misalnya di dalam daftar yang punya jarak sendiri.
   */
  spaced?: boolean;
  /** Jika diisi, kartu menjadi bisa disentuh dan memberi umpan balik tekan. */
  onPress?: () => void;
  /** Wajib diisi bersama `onPress` untuk pembaca layar. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Kartu wadah seragam untuk seluruh aplikasi.
 *
 * Sebelum komponen ini ada, gaya kartu ditulis ulang di tiap layar dengan dua
 * sistem yang bertabrakan: sebagian `radius 14 / padding 14 / bergaris`, sisanya
 * `radius 16 / padding 20 / tanpa garis`. Sekarang semua kartu memakai satu
 * bentuk, sehingga perubahan tampilan cukup dilakukan di satu berkas.
 */
export function Card({
  children,
  tone = 'surface',
  spaced = true,
  onPress,
  accessibilityLabel,
  style,
}: Props) {
  const palette = TONE[tone];
  const flattened = [styles.base, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }, spaced && styles.spaced, style];

  // Tanpa onPress, cukup View biasa agar struktur DOM paling sederhana.
  if (!onPress) {
    return <View style={flattened}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [flattened, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: layout.cardPadding,
  },
  spaced: { marginBottom: layout.cardGap },
  pressed: { opacity: opacity.pressed },
});
