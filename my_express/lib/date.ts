import dayjs from 'dayjs';
import 'dayjs/locale/id';

/**
 * Helper format tanggal aplikasi (library dayjs sesuai docs/teknologi.md).
 * Lokasi Indonesia dimuat sekali di sini supaya penulisan bulan dan hari
 * konsisten di seluruh layar.
 *
 * Catatan: timestamp dari server berupa ISO 8601 (UTC) dan akan ditampilkan
 * menurut zona waktu HP, yang diharapkan sudah WIB.
 */

/** Label sebuah hari pada daftar riwayat: "Hari ini", "Kemarin", atau tanggal panjang. */
export function formatDayLabel(isoDate: string): string {
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  if (isoDate === today) {
    return 'Hari ini';
  }
  if (isoDate === yesterday) {
    return 'Kemarin';
  }
  return dayjs(isoDate).locale('id').format('dddd, D MMMM YYYY');
}

/** Jam transaksi format 24 jam, contoh: "22:38". */
export function formatClock(isoDateTime: string): string {
  return dayjs(isoDateTime).format('HH:mm');
}

/** Singkatan hari untuk label sumbu-X grafik, contoh: "Sab". */
export function formatWeekday(isoDate: string): string {
  return dayjs(isoDate).locale('id').format('ddd');
}

/** Tanggal ringkas untuk judul kartu, contoh: "10 Okt 2026". */
export function formatShortDate(isoDate: string): string {
  return dayjs(isoDate).locale('id').format('D MMM YYYY');
}

/** Tanggal dan jam untuk daftar notifikasi, contoh: "11 Okt 2026, 14:05". */
export function formatDateTime(isoDateTime: string): string {
  return dayjs(isoDateTime).locale('id').format('D MMM YYYY, HH:mm');
}
