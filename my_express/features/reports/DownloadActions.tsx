import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { colors, fontSize, spacing } from '../../lib/theme';
import type { DownloadFormat } from './download';

interface Props {
  /** Format yang sedang diproses; null bila tidak ada proses berjalan. */
  busy: DownloadFormat | null;
  onPdf: () => void;
  onExcel: () => void;
  /**
   * Nonaktifkan seluruh baris, mis. ketika periode Kustom belum lengkap
   * sehingga laporan belum bisa disusun. Tanpa pesan, tombol mati akan
   * membingungkan — pemanggil wajib menampilkan sebabnya di dekat sini.
   */
  disabled?: boolean;
}

/**
 * Pasangan tombol unduh plus keterangan nomor laporan.
 *
 * Sengaja dipakai bersama oleh tab Pemasukan dan tab Stok: ketentuan
 * unduhannya sama persis (hanya PDF dan Excel, satu berkas, satu nomor unik),
 * sehingga perilaku dan urutannya tidak mungkin berbeda antar kedua laporan.
 *
 * Selama satu format sedang diproses, KEDUA tombol dinonaktifkan — membiarkan
 * tombol lain aktif akan menghasilkan dua lembar berbagi yang bertumpuk.
 */
export function DownloadActions({ busy, onPdf, onExcel, disabled = false }: Props) {
  const locked = busy !== null || disabled;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.half}>
          <Button
            label="Unduh PDF"
            variant="primary"
            onPress={onPdf}
            loading={busy === 'pdf'}
            disabled={locked}
          />
        </View>
        <View style={styles.half}>
          <Button
            label="Unduh Excel"
            variant="outline"
            onPress={onExcel}
            loading={busy === 'excel'}
            disabled={locked}
          />
        </View>
      </View>

      <View style={styles.note}>
        <Feather name="lock" size={14} color={colors.textMuted} />
        <Text style={styles.noteText}>
          Setiap laporan memiliki nomor unik dan waktu cetak
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  /** Kedua tombol berbagi satu baris dengan lebar sama. */
  half: { flex: 1 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  noteText: { fontSize: fontSize.caption, color: colors.textMuted },
});
