import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, layout, opacity, radius, spacing, text } from '../lib/theme';

interface Props {
  /** Judul kolom, misalnya "Kategori". */
  label: string;
  /** Nilai yang sedang terpilih; `null` berarti belum ada pilihan. */
  value: string | null;
  /** Daftar pilihan. */
  options: string[];
  /**
   * Teks untuk pilihan "Semua", diletakkan paling atas.
   * Kosongkan untuk pemilih yang wajib diisi (pada form) supaya barisnya tidak muncul.
   */
  allLabel?: string;
  /** Teks pengganti bila belum ada pilihan dan `allLabel` tidak dipakai. */
  placeholder?: string;
  onSelect: (value: string | null) => void;
  /**
   * Baris tambahan paling bawah untuk memilih mengetik nilai sendiri.
   * Tekanannya memanggil `onCustom`, bukan `onSelect`.
   */
  customLabel?: string;
  onCustom?: () => void;
  /** Pesan error validasi; jika ada, kolom berwarna merah dan pesan tampil. */
  error?: string;
}

/**
 * Pemilih satu pilihan dalam bentuk lembar bawah.
 *
 * Dipakai untuk pilihan yang jumlahnya bisa banyak dan bertambah sendiri
 * (kategori produk), sehingga tidak perlu berjejer memakan lebar layar.
 * Pilihan yang jumlahnya tetap dan sedikit lebih cocok memakai chip biasa.
 */
export function OptionPicker({
  label,
  value,
  options,
  allLabel,
  placeholder,
  onSelect,
  customLabel,
  onCustom,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const selectedLabel = value ?? allLabel ?? placeholder ?? '';
  // Belum terisi dan tidak ada pilihan "Semua" → teks ditampilkan redup.
  const kosong = value === null && allLabel === undefined;

  const choose = (next: string | null) => {
    onSelect(next);
    setOpen(false);
  };

  const chooseCustom = () => {
    onCustom?.();
    setOpen(false);
  };

  const close = () => {
    setOpen(false);
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedLabel}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          error ? styles.fieldError : null,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.value, kosong && styles.valueEmpty]} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        {/* Menutup lewat latar belakang dan tombol mundur Android. */}
        <Pressable
          style={styles.scrim}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Tutup pilihan"
        />

        <View
          style={[
            styles.sheet,
            // Jangan menempel di indikator beranda iOS.
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{label}</Text>

          <ScrollView
            style={[styles.list, { maxHeight: Math.round(height * 0.45) }]}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {allLabel !== undefined && (
              <OptionRow label={allLabel} selected={value === null} onPress={() => choose(null)} />
            )}
            {options.map((option) => (
              <OptionRow
                key={option}
                label={option}
                selected={value === option}
                onPress={() => choose(option)}
              />
            ))}
            {customLabel !== undefined && onCustom !== undefined && (
              <OptionRow label={customLabel} selected={false} onPress={chooseCustom} />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]} numberOfLines={1}>
        {label}
      </Text>
      {selected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  /** Kolom pemilih sengaja dibentuk seperti kolom isian biasa supaya
   *  pengenalan bentuknya konsisten dengan form lain di aplikasi. */
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.controlHeight,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  /** Kolom pemilih menampilkan kesalahan dengan cara yang sama seperti Input. */
  fieldError: { borderColor: colors.danger },
  value: { flex: 1, fontSize: fontSize.small, color: colors.text },
  /** Tampilan kolom yang belum diisi. */
  valueEmpty: { color: colors.textMuted },
  error: { ...text.error, marginTop: spacing.xs },
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  sheetTitle: text.cardTitle,
  list: { marginTop: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.controlHeight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { flex: 1, fontSize: fontSize.small, color: colors.textSecondary },
  rowLabelSelected: { fontWeight: '700', color: colors.primary },
  pressed: { opacity: opacity.pressed },
});
