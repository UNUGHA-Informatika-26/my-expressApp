import { printToFileAsync } from 'expo-print';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as SheetJS from 'xlsx';
import { getErrorMessage } from '../../lib/api';
import { REPORT_TITLE, reportFileBase, type ReportKind } from './reportMeta';
import {
  PDF_MIME,
  XLSX_MIME,
  shareFile,
  writeBase64File,
} from './saveFile';

/**
 * Pelaksanaan unduhan PDF dan Excel.
 *
 * Pustaka SheetJS dimuat saat aplikasi dibuka (Metro tidak memecah bundel),
 * tetapi biaya menuliskannya hanya ditanggung ketika tombol unduh ditekan.
 */

/** Format unduhan yang tersedia — hanya PDF dan Excel, sesuai ketentuan. */
export type DownloadFormat = 'pdf' | 'excel';

/**
 * Cetak HTML menjadi PDF lalu buka lembar berbagi.
 *
 * PDF sengaja diambil lewat `base64: true`, BUKAN lewat pindah berkas dari
 * `printed.uri`. `FileSystemPath.move()` memvalidasi izin lewat
 * `getPathPermissions()`, dan berkas hasil `expo-print` (di subfolder
 * `Print/` pada cache) tidak lolos pemeriksaan itu — Android menolaknya
 * dengan "Missing 'READ' permission for accessing the file".
 *
 * Dengan mengambil isinya sebagai base64, PDF ditulis ulang oleh
 * `writeBase64File` — jalur yang persis sama dengan Excel, yang terbukti
 * bekerja. `File.write` tidak memvalidasi izin apa pun, sehingga tidak ada
 * pemeriksaan yang bisa ditolak.
 *
 * Nama berkas tetap `Laporan-Pemasukan-YYYY-MM-DD.pdf`, bukan nama acak
 * hasil `expo-print`.
 */
export async function bagikanPdf(html: string, kind: ReportKind): Promise<void> {
  const printed = await printToFileAsync({ html, base64: true });
  const base64 = printed.base64;
  if (!base64) {
    throw new Error('Hasil cetak PDF tidak berisi data.');
  }
  const uri = writeBase64File(`${reportFileBase(kind)}.pdf`, base64);
  await shareFile(uri, PDF_MIME, `Bagikan ${REPORT_TITLE[kind]}`);
}

/**
 * Tulis workbook menjadi .xlsx lalu buka lembar berbagi.
 *
 * `type: 'base64'` menghasilkan isi berkas dalam base64, yang kemudian
 * ditulis ulang sebagai byte lewat `encoding: 'base64'` — dua langkah itu
 * yang membuat file .xlsx-nya sah dan bisa langsung dibuka Excel.
 */
export async function bagikanExcel(workbook: SheetJS.WorkBook, kind: ReportKind): Promise<void> {
  const base64: string = SheetJS.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const uri = writeBase64File(`${reportFileBase(kind)}.xlsx`, base64);
  await shareFile(uri, XLSX_MIME, `Bagikan ${REPORT_TITLE[kind]}`);
}

/**
 * Status tombol unduh beserta pelaksanaannya — SATU tempat untuk kedua tab,
 * supaya perilakunya tidak berbeda-beda.
 *
 * Dua hal yang dijaga di sini:
 * 1. Tombol menampilkan loading DAN menolak tekanan kedua selama proses,
 *    sehingga satu periode tidak pernah menghasilkan dua file.
 * 2. Setiap kegagalan — termasuk perangkat yang tidak mendukung berbagi file —
 *    dilaporkan sebagai pesan Indonesia, bukan sebagai galat mentah.
 */
export function useDownloadReport() {
  const [busy, setBusy] = useState<DownloadFormat | null>(null);

  const download = useCallback(
    async (
      format: DownloadFormat,
      failureTitle: string,
      action: () => Promise<void>,
    ): Promise<void> => {
      if (busy !== null) {
        return;
      }
      setBusy(format);
      try {
        await action();
      } catch (error) {
        Alert.alert(failureTitle, getErrorMessage(error));
      } finally {
        setBusy(null);
      }
    },
    [busy],
  );

  return { busy, download };
}
