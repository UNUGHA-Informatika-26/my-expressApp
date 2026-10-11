import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  /** true: tampilkan spinner dan nonaktifkan tombol. */
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger';
}

/** Tombol utama aplikasi dengan status loading bawaan. */
export function Button({ label, onPress, loading = false, disabled = false, variant = 'primary' }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'danger' ? styles.danger : styles.primary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: '#2563EB' },
  danger: { backgroundColor: '#DC2626' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
