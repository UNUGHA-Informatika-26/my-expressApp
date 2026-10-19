/**
 * Perhitungan tanggal menurut zona WIB (UTC+7).
 *
 * 03-database.md: hari ("hari ini", "kemarin", grafik 7 hari) dihitung dengan
 * zona waktu Asia/Jakarta (WIB).
 *
 * Ditulis manual tanpa library supaya hasilnya sama di server mana pun dan
 * tidak bergantung pada konfigurasi ICU Node. Zona WIB tidak punya daylight
 * saving, jadi offset +7 jam berlaku sepanjang tahun.
 */

/** Offset WIB dari UTC dalam milidetik. */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Satu hari dalam milidetik. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Tanggal WIB format `YYYY-MM-DD`, contoh: `2026-10-10`. */
export function toWibDate(date: Date): string {
  const shifted = new Date(date.getTime() + WIB_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Tanggal WIB padat `YYYYMMDD` untuk nomor transaksi, contoh: `20261010`. */
export function toWibDateCompact(date: Date): string {
  return toWibDate(date).replace(/-/g, '');
}

/** Jam WIB `HH:mm` untuk laporan, contoh: `14:05`. */
export function toWibTime(date: Date): string {
  const shifted = new Date(date.getTime() + WIB_OFFSET_MS);
  const hours = String(shifted.getUTCHours()).padStart(2, '0');
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Awal hari WIB (00:00:00.000) dari tanggal `YYYY-MM-DD`. */
export function wibDayStart(date: string): Date {
  return new Date(`${date}T00:00:00.000+07:00`);
}

/** Akhir hari WIB (23:59:59.999) dari tanggal `YYYY-MM-DD`. */
export function wibDayEnd(date: string): Date {
  return new Date(`${date}T23:59:59.999+07:00`);
}

/**
 * Geser tanggal `YYYY-MM-DD` sejumlah hari (boleh negatif).
 * Dipakai untuk membangun rentang grafik 7 hari tanpa salah hitung
 * ketika melewati batas bulan.
 */
export function addWibDays(date: string, days: number): string {
  const base = new Date(`${date}T00:00:00.000Z`);
  const shifted = new Date(base.getTime() + days * DAY_MS);
  return shifted.toISOString().slice(0, 10);
}
