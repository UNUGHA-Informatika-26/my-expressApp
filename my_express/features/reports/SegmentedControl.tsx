import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  fontSize,
  fontWeight,
  layout,
  navy,
  opacity,
  radius,
  spacing,
} from '../../lib/theme';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Pengalih dua pilihan selebar sama — dipakai untuk Pemasukan / Stok.
 *
 * Dipisah dari chip agar bentuknya jelas berbeda: chip memilih di dalam satu
 * bagian (periode, filter), pengalih ini memilih SELURUH isi layar. Pilihan
 * aktif berlatar navy pekat dengan teks putih, persis pola yang dipakai
 * seluruh chip terpilih di aplikasi.
 */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              active && styles.segmentActive,
              pressed && !active && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: navy.border,
    borderRadius: radius.pill,
  },
  /** Tiap pilihan `flex: 1`, sehingga keduanya selalu sama lebarnya. */
  segment: {
    flex: 1,
    minHeight: layout.controlHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  segmentActive: { backgroundColor: navy.dark },
  pressed: { opacity: opacity.pressed },
  label: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  labelActive: { color: colors.textInverse },
});
