/**
 * Pembungkus CSV sederhana untuk laporan my_express.
 *
 * Ditulis manual tanpa library tambahan (02-teknologi.md tidak mencantumkan
 * generator CSV). Dua hal yang wajib ditangani agar file benar:
 * 1. **Escaping** — nilai yang memuat koma, tanda kutip, atau baris baru
 *    harus dibungkus tanda kutip ganda, dan kutip di dalamnya digandakan
 *    (aturan RFC 4180). Tanpa ini, nama produk seperti `Pensil "2B", isi 12`
 *    akan merusak seluruh baris.
 * 2. **BOM UTF-8** — Excel di Windows membaca CSV sebagai ANSI tanpa BOM,
 *    sehingga huruf Indonesia (é, ó) menjadi kacau. BOM `\uFEFF` memaksa
 *    Excel memakai UTF-8.
 */

/** Tanda kutip ganda di awal dan akhir file. */
export const CSV_BOM = '\uFEFF';

/** Nilai satu sel; ditulis apa adanya setelah diproses. */
export type CsvCell = string | number | null | undefined;

/** Bungkus satu nilai sesuai aturan CSV; `null`/`undefined` menjadi sel kosong. */
export function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);
  const needsQuotes = /[",\r\n]/.test(text);

  if (!needsQuotes) {
    return text;
  }

  // Kutip di dalam sel digandakan, lalu sel dibungkus kutip.
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Susun beberapa baris menjadi teks CSV lengkap (sudah ber-BOM).
 * Baris pertama dianggap judul kolom.
 */
export function toCsv(rows: CsvCell[][]): string {
  const body = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  // \r\n sesuai rekomendasi RFC 4180 dan dibaca benar oleh Excel.
  return `${CSV_BOM}${body}\r\n`;
}

/**
 * Nama file laporan berisi tanggal agar pengguna bisa membedakan unduhan.
 * Contoh: `laporan-transaksi-20261011.csv`.
 */
export function reportFileName(kind: 'transaksi' | 'stok', extra?: string): string {
  const suffix = extra ? `-${extra}` : '';
  return `laporan-${kind}${suffix}.csv`;
}
