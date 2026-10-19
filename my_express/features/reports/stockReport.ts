import type * as XLSX from 'xlsx';
import { STOCK_STATUS_LABEL } from '../catalog/StockBadge';
import type { Product } from '../../types/api';
import { escapeHtml, htmlPage } from './html';
import { REPORT_TITLE, metadataRows, type ReportMeta } from './reportMeta';
import {
  INT_FORMAT,
  applyNumberFormat,
  colLetter,
  setSumFormula,
  sheetFromRows,
  singleSheetWorkbook,
} from './xlsx';

/** Seluruh bahan yang diperlukan untuk membuat satu laporan stok. */
export interface StockReportData {
  storeName: string;
  /** Produk yang ditampilkan — mengikuti filter yang sedang aktif di layar. */
  products: Product[];
  /** Jumlah menipis dan habis atas SELURUH produk, sesuai dua kartu ringkasan. */
  menipisCount: number;
  habisCount: number;
  meta: ReportMeta;
}

/** Lebar kolom (dalam karakter) untuk tabel laporan stok. */
const COLUMN_WIDTHS = [34, 22, 10, 10, 12];

/**
 * Susun HTML laporan stok untuk dicetak menjadi PDF.
 *
 * Stok adalah potret pada satu saat, jadi tidak ada periode — tanggalnya
 * dibawa oleh `meta.period`. Seluruh teks melewati `escapeHtml`.
 */
export function buildStockHtml(data: StockReportData): string {
  const { storeName, products, menipisCount, habisCount, meta } = data;

  const tableBody =
    products.length > 0
      ? products
          .map(
            (product) => `      <tr>
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.barcode)}</td>
        <td class="num">${product.stock}</td>
        <td class="num">${product.minStock}</td>
        <td>${escapeHtml(STOCK_STATUS_LABEL[product.stockStatus])}</td>
      </tr>`,
          )
          .join('\n')
      : '      <tr><td colspan="5" class="empty">Tidak ada produk yang cocok dengan filter ini.</td></tr>';

  const metaRows = metadataRows(meta)
    .map(([label, value]) => `  <div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`)
    .join('\n');

  return htmlPage(
    REPORT_TITLE.STK,
    `  <h1>${escapeHtml(REPORT_TITLE.STK)}</h1>
  <p class="store">${escapeHtml(storeName)}</p>
  <p class="period">Tanggal: ${escapeHtml(meta.period)}</p>

  <div class="summary">
    <p class="summary-label">Ringkasan stok</p>
    <dl class="summary-grid">
      <div class="summary-cell half"><dt>Jumlah stok menipis</dt><dd>${menipisCount}</dd></div>
      <div class="summary-cell half"><dt>Jumlah stok habis</dt><dd>${habisCount}</dd></div>
    </dl>
  </div>

  <p class="section">Daftar produk</p>
  <table class="grid">
    <thead>
      <tr><th>Nama</th><th>Barcode</th><th class="num">Stok</th><th class="num">Minimum</th><th>Status</th></tr>
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
 * Susun workbook laporan stok: metadata di atas, ringkasan, lalu tabel.
 * Kolom Stok dan Minimum berupa angka murni, dan total stok memakai rumus `SUM`.
 */
export function buildStockWorkbook(data: StockReportData): XLSX.WorkBook {
  const { storeName, products, menipisCount, habisCount, meta } = data;

  const rows: (string | number)[][] = [];
  /** Sel berisi bilangan bulat yang perlu format angka (referensi 1-based). */
  const intRefs: string[] = [];

  const addRow = (cells: (string | number)[]): number => {
    rows.push(cells);
    return rows.length;
  };

  addRow([REPORT_TITLE.STK]);
  addRow(['Nama toko', storeName]);
  addRow(['Tanggal', meta.period]);
  for (const [label, value] of metadataRows(meta)) {
    addRow([label, value]);
  }

  addRow([]);
  addRow(['Ringkasan']);
  intRefs.push(`B${addRow(['Jumlah stok menipis', menipisCount])}`);
  intRefs.push(`B${addRow(['Jumlah stok habis', habisCount])}`);

  addRow([]);
  addRow(['Nama', 'Barcode', 'Stok', 'Minimum', 'Status']);

  const firstDataRow = rows.length + 1;
  for (const product of products) {
    addRow([
      product.name,
      product.barcode,
      product.stock,
      product.minStock,
      STOCK_STATUS_LABEL[product.stockStatus],
    ]);
  }
  const lastDataRow = rows.length;
  for (let index = 0; index < products.length; index += 1) {
    const rowNumber = firstDataRow + index;
    intRefs.push(`C${rowNumber}`, `D${rowNumber}`);
  }

  addRow([]);
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const totalRow = addRow(['Total stok', '', totalStock, '', '']);

  const sheet = sheetFromRows(rows, COLUMN_WIDTHS);
  applyNumberFormat(sheet, intRefs, INT_FORMAT);
  applyNumberFormat(sheet, [`C${totalRow}`], INT_FORMAT);

  if (products.length > 0) {
    setSumFormula(
      sheet,
      `C${totalRow}`,
      `${colLetter(2)}${firstDataRow}:${colLetter(2)}${lastDataRow}`,
      totalStock,
      INT_FORMAT,
    );
  }

  return singleSheetWorkbook(REPORT_TITLE.STK, sheet);
}
