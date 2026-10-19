import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSize, fontWeight, navy, opacity, radius, spacing } from '../../lib/theme';

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
  /**
   * Jumlah di dalam kurung setelah label, mis. `Menipis (3)` — cara yang
   * diminta desain untuk menampilkan jumlah tanpa menambah elemen kedua.
   */
  count?: number;
}

/**
 * Chip pilihan pada layar Laporan — dipakai untuk periode pemasukan dan
 * filter stok, supaya keduanya bertindak dan tampil seragam.
 *
 * Saat aktif latarnya gradasi navy (sama dengan chip Riwayat lama dan tab
 * aktif), sehingga keadaan terpilih terlihat jelas di atas latar kartu putih.
 */
export function Chip({ label, active, onPress, count }: Props) {
  const text = count === undefined ? label : `${label} (${count})`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}
    >
      {active && (
        <LinearGradient
          colors={[navy.main, navy.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text style={[styles.label, active && styles.labelActive]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    // Tanpa ini isi gradasi tidak terpotong mengikuti sudut membulat.
    overflow: 'hidden',
  },
  chipActive: { borderColor: navy.main },
  pressed: { opacity: opacity.pressed },
  label: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  labelActive: { color: colors.textInverse },
});
