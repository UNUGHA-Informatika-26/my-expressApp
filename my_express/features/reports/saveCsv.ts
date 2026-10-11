import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** UTI iOS untuk berkas CSV, agar iOS membukanya sebagai lembar kerja. */
const CSV_UTI = 'public.comma-separated-values-text';

/**
 * Simpan CSV ke cache aplikasi lalu buka lembar berbagi sistem.
 *
 * Memakai API kelas `File`/`Paths` milik expo-file-system SDK 57.
 * API lama (`writeAsStringAsync`) sudah deprecated dan akan throw di runtime.
 *
 * Berkas ditaruh di `Paths.cache` karena hanya perlu bertahan sampai lembar
 * berbagi ditutup; sistem bebas menghapusnya saat penyimpanan menipis.
 */
export async function saveAndShareCsv(
  filename: string,
  csv: string,
  dialogTitle: string,
): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Perangkat ini tidak mendukung membagikan file.');
  }

  const file = new File(Paths.cache, filename);
  // `overwrite: true` supaya mengunduh dua kali tidak error file sudah ada.
  file.create({ overwrite: true });
  file.write(csv);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle,
    UTI: CSV_UTI,
  });
}
