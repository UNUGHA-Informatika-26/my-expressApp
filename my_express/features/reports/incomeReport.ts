import type * as XLSX from 'xlsx';
import { formatDateTime } from '../../lib/date';
import { formatRupiah } from '../../lib/format';
import { PAYMENT_METHOD_LABEL } from '../../lib/receiptText';
import type { TransactionSummary } from '../../types/api';
import type { IncomeTotals } from './incomeData';
import { escapeHtml, htmlPage } from './html';
import { REPORT_TITLE, metadataRows, type ReportMeta } from './reportMeta';
import {
  RP_FORMAT,
  applyNumberFormat,
  colLetter,
  setSumFormula,
  sheetFromRows,
  singleSheetWorkbook,
} from './xlsx';

/** Seluruh bahan yang diperlukan untuk membuat satu laporan pemasukan. */
export interface IncomeReportData {
  storeName: string;
  totals: IncomeTotals;
  /** Transaksi datar, terbaru di atas — hasil `flattenDays(useIncome().days)`. */
  transactions: TransactionSummary[];
  meta: ReportMeta;
}

/** Angka item terjual; tanda hubung bila CSV laporan belum berhasil dibaca. */
function itemsSoldText(totals: IncomeTotals): string {
  return totals.itemsSold === null ? '—' : String(totals.itemsSold);
}

/** Lebar kolom (dalam karakter) untuk tabel laporan pemasukan. */
const COLUMN_WIDTHS = [26, 24, 14, 16];

/**
 * Susun HTML laporan pemasukan untuk dicetak menjadi PDF.
 *
 * Semua teks melewati `escapeHtml`; angka diformat lewat helper Rupiah tunggal
 * agar penulisannya sama persis dengan layar.
 */
export function buildIncomeHtml(data: IncomeReportData): string {
  const { storeName, totals, transactions, meta } = data;

  const body = transactions
    .map(
      (transaction) => `      <tr>
        <td>${escapeHtml(transaction.code)}</td>
        <td>${escapeHtml(formatDateTime(transaction.createdAt))}</td>
        <td>${escapeHtml(PAYMENT_METHOD_LABEL[transaction.paymentMethod])}</td>
        <td class="num">${escapeHtml(formatRupiah(transaction.total))}</td>
      </tr>`,
    )
    .join('\n');

  const tableBody =
    transactions.length > 0
      ? body
      : '      <tr><td colspan="4" class="empty">Tidak ada transaksi pada periode ini.</td></tr>';

  const metaRows = metadataRows(meta)
    .map(([label, value]) => `  <div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`)
    .join('\n');

  return htmlPage(
    REPORT_TITLE.PMS,
    `  <h1>${escapeHtml(REPORT_TITLE.PMS)}</h1>
  <p class="store">${escapeHtml(storeName)}</p>
  <p class="period">${escapeHtml(meta.period)}</p>

  <div class="summary">
    <p class="summary-label">Total pemasukan</p>
    <p class="summary-total">${escapeHtml(formatRupiah(totals.total))}</p>
    <dl class="summary-grid">
      <div class="summary-cell"><dt>Jumlah transaksi</dt><dd>${totals.count}</dd></div>
      <div class="summary-cell"><dt>Item terjual</dt><dd>${escapeHtml(itemsSoldText(totals))}</dd></div>
      <div class="summary-cell"><dt>Total Tunai</dt><dd>${escapeHtml(formatRupiah(totals.cash.total))}</dd></div>
      <div class="summary-cell"><dt>Total QRIS</dt><dd>${escapeHtml(formatRupiah(totals.qris.total))}</dd></div>
    </dl>
  </div>

  <p class="section">Rincian transaksi</p>
  <table class="grid">
    <thead>
      <tr><th>No. Transaksi</th><th>Tanggal-jam</th><th>Metode</th><th class="num">Total</th></tr>
    </thead>
    <tbody>
${tableBody}
    </tbody>
  </table>

  <div class="meta">
${metaRows}
  </div>`,
  );
}

/**
 * Susun workbook laporan pemasukan.
 *
 * Susunan baris: judul dan metadata di atas, ringkasan di bawahnya, lalu
 * tabel transaksi — sesuai ketentuan Excel. Kolom nominal berisi angka murni
 * dan diformat Rupiah; baris total memakai rumus `SUM`.
 */
export function buildIncomeWorkbook(data: IncomeReportData): XLSX.WorkBook {
  const { storeName, totals, transactions, meta } = data;

  const rows: (string | number)[][] = [];
  /** Sel bernilai uang, disimpan sebagai referensi 1-based (mis. `B8`). */
  const moneyRefs: string[] = [];

  /** Tambah satu baris; nilai baliknya nomor baris 1-based. */
  const addRow = (cells: (string | number)[]): number => {
    rows.push(cells);
    return rows.length;
  };

  addRow([REPORT_TITLE.PMS]);
  addRow(['Nama toko', storeName]);
  for (const [label, value] of metadataRows(meta)) {
    addRow([label, value]);
  }

  addRow([]);
  addRow(['Ringkasan']);
  moneyRefs.push(`B${addRow(['Total pemasukan', totals.total])}`);
  addRow(['Jumlah transaksi', totals.count]);
  addRow(['Item terjual', totals.itemsSold ?? '']);
  moneyRefs.push(`B${addRow(['Total Tunai', totals.cash.total])}`);
  moneyRefs.push(`B${addRow(['Total QRIS', totals.qris.total])}`);

  addRow([]);
  addRow(['No. Transaksi', 'Tanggal-jam', 'Metode', 'Total (Rp)']);

  const firstDataRow = rows.length + 1;
  for (const transaction of transactions) {
    addRow([
      transaction.code,
      formatDateTime(transaction.createdAt),
      PAYMENT_METHOD_LABEL[transaction.paymentMethod],
      transaction.total,
    ]);
  }
  const lastDataRow = rows.length;
  const dataRefs = transactions.map((_, index) => `D${firstDataRow + index}`);

  addRow([]);
  const totalRow = addRow(['Total', '', '', totals.total]);

  const sheet = sheetFromRows(rows, COLUMN_WIDTHS);
  applyNumberFormat(sheet, moneyRefs, RP_FORMAT);
  applyNumberFormat(sheet, dataRefs, RP_FORMAT);
  applyNumberFormat(sheet, [`D${totalRow}`], RP_FORMAT);

  if (transactions.length > 0) {
    setSumFormula(
      sheet,
      `D${totalRow}`,
      `${colLetter(3)}${firstDataRow}:${colLetter(3)}${lastDataRow}`,
      totals.total,
    );
  }

  return singleSheetWorkbook(REPORT_TITLE.PMS, sheet);
}
