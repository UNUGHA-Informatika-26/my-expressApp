import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { registerScanHandler } from './scan-result';

interface Props {
  /** Dipanggil dengan kode yang terbaca (baik dari kamera maupun ketikan manual). */
  onResult: (barcode: string) => void;
  /** 'button' untuk di dalam form, 'icon' untuk di toolbar. */
  variant?: 'button' | 'icon';
  label?: string;
}

/**
 * Tombol pembuka layar scan.
 * Mendaftarkan penerima hasil dulu, baru membuka /scan — urutan ini wajib
 * supaya hasil scan sampai ke layar yang benar.
 */
export function ScanButton({ onResult, variant = 'button', label = 'Pindai Barcode' }: Props) {
  const onPress = () => {
    registerScanHandler(onResult);
    router.push('/scan');
  };

  if (variant === 'icon') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
      >
        <Ionicons name="scan-outline" size={22} color="#FFFFFF" />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name="scan-outline" size={18} color="#2563EB" />
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    marginBottom: 16,
  },
  buttonLabel: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
