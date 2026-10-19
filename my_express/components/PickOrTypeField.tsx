import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors, fontSize, opacity, spacing } from '../lib/theme';
import { Input } from './Input';
import { OptionPicker } from './OptionPicker';

interface Props {
  /** Judul kolom, misalnya "Kategori" atau "Satuan". */
  label: string;
  /** Nilai saat ini; string kosong berarti belum dipilih. */
  value: string;
  /** Daftar pilihan cepat yang ditawarkan. */
  options: string[];
  /** Teks kolom ketik selama nilai masih kosong. */
  placeholder: string;
  /** Teks baris terakhir untuk mengetik nilai di luar daftar. */
  customLabel: string;
  maxLength?: number;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /** Pesan error validasi. */
  error?: string;
  onChange: (value: string) => void;
}

/**
 * Kolom isian yang menawarkan pilihan dari daftar, tapi tetap mengizinkan
 * nilai di luar daftar.
 *
 * Dipakai untuk kategori dan satuan produk: keduanya berulang sehingga layak
 * disediakan pilihan, tapi tetap harus bisa diisi sendiri karena daftar mana
 * pun tidak bisa menebak seluruh kebutuhan toko.
 *
 * Selama nilai cocok dengan salah satu pilihan, tampil sebagai pemilih.
 * Begitu pengguna memilih "Ketik sendiri…" — atau nilai di luar daftar sudah
 * terisi (produk lama) — kolomnya berubah jadi kolom teks biasa.
 * Nilai di luar daftar tidak pernah dibuang diam-diam.
 */
export function PickOrTypeField({
  label,
  value,
  options,
  placeholder,
  customLabel,
  maxLength,
  autoCapitalize,
  error,
  onChange,
}: Props) {
  // Nilai di luar daftar langsung dibuka sebagai kolom teks supaya tidak hilang.
  const [ketik, setKetik] = useState(() => value !== '' && !options.includes(value));

  if (ketik) {
    return (
      <View>
        <Input
          label={label}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          error={error}
        />
        {/* Kembali memakai daftar pilihan. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onChange('');
            setKetik(false);
          }}
          style={({ pressed }) => [styles.gantiMode, pressed && styles.gantiModeTekan]}
        >
          <Text style={styles.gantiModeTeks}>Pilih dari daftar {label.toLowerCase()}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <OptionPicker
      label={label}
      value={value === '' ? null : value}
      options={options}
      placeholder={`Pilih ${label.toLowerCase()}`}
      onSelect={(next) => onChange(next ?? '')}
      customLabel={customLabel}
      onCustom={() => {
        onChange('');
        setKetik(true);
      }}
      error={error}
    />
  );
}

const styles = StyleSheet.create({
  /** Tautan kecil untuk beralih antara memilih dari daftar dan mengetik sendiri. */
  gantiMode: { marginTop: spacing.xs, alignSelf: 'flex-start' },
  gantiModeTekan: { opacity: opacity.muted },
  gantiModeTeks: { fontSize: fontSize.caption, fontWeight: '600', color: colors.primary },
});
