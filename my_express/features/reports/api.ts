import { api } from '../../lib/api';

/** Hasil unduhan laporan: isi CSV siap simpan dan nama file-nya. */
export interface ReportCsv {
  csv: string;
  filename: string;
}

/** Rentang tanggal laporan transaksi, format YYYY-MM-DD. */
export interface TransactionReportRange {
  from?: string;
  to?: string;
}

/** BOM UTF-8; tanpa ini Excel di Windows membaca CSV sebagai ANSI. */
const UTF8_BOM = '\uFEFF';

/**
 * Pastikan CSV tetap ber-BOM.
 *
 * Backend sudah mengirim BOM, tetapi lapisan jaringan React Native bisa
 * membuangnya saat mengubah byte menjadi string. Menambahkan hanya bila
 * belum ada membuat hasilnya idempoten dan Excel tetap aman.
 */
function ensureBom(text: string): string {
  return text.startsWith(UTF8_BOM) ? text : UTF8_BOM + text;
}

/** Ambil nama file dari header Content-Disposition; `fallback` bila tidak ada. */
function filenameFrom(disposition: string, fallback: string): string {
  const match = /filename="([^"]+)"/.exec(disposition);
  return match?.[1] ?? fallback;
}

/**
 * Ambil laporan CSV dari server.
 *
 * `responseType: 'text'` dan transformasi identitas dipakai bersama-sama
 * agar axios tidak pernah mencoba `JSON.parse` atas isi CSV — kalau ada
 * angka yang beruntung terbaca sebagai JSON, isinya akan rusak diam-diam.
 */
async function fetchCsv(
  url: string,
  params: TransactionReportRange | undefined,
  fallbackFilename: string,
): Promise<ReportCsv> {
  const response = await api.get<string>(url, {
    params,
    responseType: 'text',
    transformResponse: [(data: unknown) => data],
  });

  const disposition = String(response.headers['content-disposition'] ?? '');
  return {
    csv: ensureBom(String(response.data ?? '')),
    filename: filenameFrom(disposition, fallbackFilename),
  };
}

/** GET /api/reports/transactions — laporan transaksi CSV (04-api.md bagian 7). */
export async function fetchTransactionsReport(
  range: TransactionReportRange,
): Promise<ReportCsv> {
  const hasRange = Boolean(range.from || range.to);
  const label = hasRange ? `${range.from ?? 'awal'}-sampai-${range.to ?? 'akhir'}` : 'semua';
  return fetchCsv(
    '/api/reports/transactions',
    hasRange ? range : undefined,
    `laporan-transaksi-${label}.csv`,
  );
}

/** GET /api/reports/stock — laporan stok CSV (04-api.md bagian 7). */
export async function fetchStockReport(): Promise<ReportCsv> {
  return fetchCsv('/api/reports/stock', undefined, 'laporan-stok.csv');
}
