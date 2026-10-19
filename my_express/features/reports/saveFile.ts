import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Penulisan dan pembagian file laporan.
 *
 * Seluruh berkas ditulis lewat API kelas `File`/`Paths` milik expo-file-system
 * SDK 57 — API lama (`writeAsStringAsync`) sudah deprecated dan akan throw di
 * runtime, jadi tidak dipakai di sini.
 *
 * Berkas diletakkan di `Paths.cache` karena hanya perlu bertahan sampai lembar
 * berbagi ditutup; sistem bebas menghapusnya saat penyimpanan menipis.
 */

/** Teks pesan bila perangkat tidak bisa membuka lembar berbagi. */
export const SHARE_UNAVAILABLE = 'Laporan tidak dapat dibagikan di perangkat ini';

/**
 * Tulis isi base64 ke cache sebagai berkas nyata dan kembalikan URI-nya.
 *
 * `encoding: 'base64'` memerintahkan runtime mengubah string menjadi byte
 * sebelum menulis — tanpanya string base64 akan tersimpan sebagai teks biasa
 * dan isi file-nya (.xlsx maupun .pdf) akan rusak.
 */
export function writeBase64File(filename: string, base64: string): string {
  const file = new File(Paths.cache, filename);
  // `overwrite: true` supaya mengunduh dua kali tidak error file sudah ada.
  file.create({ overwrite: true });
  file.write(base64, { encoding: 'base64' });
  return file.uri;
}

/**
 * Buka lembar berbagi sistem untuk satu berkas.
 *
 * Gagal di sini selalu dilaporkan dengan pesan yang sama, karena pengguna
 * tidak membedakan "tidak didukung", "dibatalkan", atau "terjadi galat" —
 * ketiganya berarti laporan tidak dapat dibagikan dari perangkat ini.
 */
export async function shareFile(
  uri: string,
  mimeType: string,
  dialogTitle: string,
): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error(SHARE_UNAVAILABLE);
  }

  try {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle });
  } catch {
    throw new Error(SHARE_UNAVAILABLE);
  }
}

/** MIME PDF sesuai ketentuan unduhan laporan. */
export const PDF_MIME = 'application/pdf';

/** MIME .xlsx (Office Open XML Spreadsheet). */
export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
