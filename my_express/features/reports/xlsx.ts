import * as XLSX from 'xlsx';

/**
 * Pembantu penulisan file Excel lewat SheetJS.
 *
 * Kunci yang dijaga di sini: **nilai uang harus berupa angka, bukan teks**.
 * `aoa_to_sheet` mengubah angka JavaScript menjadi sel numerik (`t: 'n'`),
 * sehingga file bisa dijumlahkan dan disaring di Excel; format tampilan
 * ditambahkan lewat `z` tanpa mengubah nilai dasarnya.
 */

/** Format tampilan rupiah tanpa desimal; pemisah ribuan mengikuti lokasi Excel. */
export const RP_FORMAT = '"Rp "#,##0';

/** Format tampilan bilangan bulat, untuk kolom jumlah. */
export const INT_FORMAT = '#,##0';

/** Ubah indeks kolom menjadi huruf (0 → A, 3 → D). */
export function colLetter(index: number): string {
  return XLSX.utils.encode_col(index);
}

/** Susun lembar kerja dari matriks sel, lengkap dengan lebar kolomnya. */
export function sheetFromRows(
  rows: (string | number)[][],
  widths: number[],
): XLSX.WorkSheet {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = widths.map((wch) => ({ wch }));
  return sheet;
}

/**
 * Terapkan format tampilan ke sel yang BENAR-BENAR bernilai angka.
 *
 * Sel kosong atau sel teks dilewatkan, karena memberi format angka pada teks
 * hanya membuat bingung — dan merusak angka bila pembaca mencoba mengonversinya.
 */
export function applyNumberFormat(
  sheet: XLSX.WorkSheet,
  refs: string[],
  format: string,
): void {
  for (const ref of refs) {
    const cell = sheet[ref] as XLSX.CellObject | undefined;
    if (cell && cell.t === 'n') {
      cell.z = format;
    }
  }
}

/**
 * Ubah sel total menjadi rumus `SUM`, sambil mempertahankan nilai hasilnya.
 *
 * Nilai `v` sengaja tetap ditulis: file yang dibuka pembaca yang tidak
 * menghitung ulang rumus (beberapa pratinjau file) tetap menampilkan angka
 * yang benar, dan Excel akan menghitung ulang saat file dibuka.
 */
export function setSumFormula(
  sheet: XLSX.WorkSheet,
  totalRef: string,
  sumRange: string,
  value: number,
  format: string = RP_FORMAT,
): void {
  const cell = sheet[totalRef] as XLSX.CellObject | undefined;
  if (!cell || cell.t !== 'n') {
    return;
  }
  cell.f = `SUM(${sumRange})`;
  cell.v = value;
  cell.z = format;
}

/** Rakit workbook satu lembar dengan nama yang valid untuk Excel. */
export function singleSheetWorkbook(sheetName: string, sheet: XLSX.WorkSheet): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  return workbook;
}
