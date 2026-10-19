/**
 * Parser CSV RFC 4180 untuk laporan yang dikirim backend.
 *
 * Backend mengirim laporan sebagai CSV (docs/04-api.md bagian 7), dan
 * "jumlah item terjual" hanya tersedia di sana — riwayat JSON memang tidak
 * memuat jumlah item per transaksi. Karena itu isi CSV dibaca di sini.
 *
 * Parser ini menangani tiga hal yang merusak hasil kalau diabaikan:
 * 1. Kutip ganda mengelilingi sel yang memuat koma, kutip, atau baris baru,
 *    dan kutip di dalamnya digandakan (`""` → `"`).
 * 2. Baris baru berupa `\r\n` maupun `\n`.
 * 3. BOM UTF-8 di awal berkas — tanpa dibuang, nama kolom pertama tidak akan
 *    pernah cocok.
 */

/** Buang BOM UTF-8 bila ada; tanpa BOM hasilnya tetap sama. */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Ubah isi CSV menjadi matriks sel, baris demi baris.
 * Baris kosong di akhir berkas tidak menghasilkan sel tambahan.
 */
export function parseCsv(text: string): string[][] {
  const src = stripBom(text);
  const rows: string[][] = [];

  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let index = 0;

  const endField = (): void => {
    row.push(field);
    field = '';
  };
  const endRow = (): void => {
    endField();
    rows.push(row);
    row = [];
  };

  while (index < src.length) {
    const char = src[index];

    if (inQuotes) {
      if (char === '"') {
        if (src[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }

    if (char === '"' && field === '') {
      // Kutip hanya membuka sel bila berada di posisi pertama sel.
      inQuotes = true;
      index += 1;
      continue;
    }

    if (char === ',') {
      endField();
      index += 1;
      continue;
    }

    if (char === '\r' || char === '\n') {
      if (char === '\r' && src[index + 1] === '\n') {
        index += 2;
      } else {
        index += 1;
      }
      endRow();
      continue;
    }

    field += char;
    index += 1;
  }

  // Sel terakhir tidak diakhiri pemisah baris — tetap dicatat.
  if (field !== '' || row.length > 0) {
    endRow();
  }

  return rows;
}
