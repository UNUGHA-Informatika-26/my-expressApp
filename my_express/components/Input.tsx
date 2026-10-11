import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  /** Pesan error validasi; jika ada, kolom berwarna merah dan pesan tampil. */
  error?: string;
}

/** Kolom teks berlabel dengan pesan error. */
export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, style, ...inputProps },
  ref,
) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor="#9CA3AF"
        style={[styles.input, error ? styles.inputError : null, style]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

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
