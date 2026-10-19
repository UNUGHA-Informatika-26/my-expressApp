import { colors, home, navy } from '../../lib/theme';

/**
 * Templat halaman PDF laporan dan pengaman teks untuknya.
 *
 * Seluruh isi laporan berasal dari data pengguna (nama toko, kode transaksi,
 * nama produk, barcode). Tanpa pengamanan, satu nama produk berisi `<` atau
 * `&` dapat merusak struktur halaman atau menanam markup yang ikut tercetak.
 * Karena itu SEMUA teks melewati `escapeHtml` sebelum masuk ke templat.
 *
 * Warna pada CSS diambil dari `lib/theme.ts`, bukan ditulis sebagai hex di
 * sini — supaya PDF ikut berubah bila palet navy dirapikan.
 */

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Ganti lima karakter berbahaya dengan entitas HTML-nya. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ENTITIES[character] ?? character);
}

/**
 * Bungkus isi laporan menjadi satu dokumen HTML lengkap.
 *
 * Lebar halaman dibuat 612×792 piksel (kertas US Letter) supaya tepinya
 * konsisten — `expo-print` memakai ukuran yang sama sebagai nilai bawaan.
 */
export function htmlPage(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 40px;
    color: ${colors.text};
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 12px;
    line-height: 1.45;
  }
  h1 { font-size: 21px; color: ${navy.dark}; margin: 0 0 2px; }
  .store { font-size: 13px; color: ${colors.textMuted}; margin: 0 0 4px; }
  .period { font-size: 12px; color: ${navy.textSecondary}; margin: 0 0 16px; }
  .section { font-size: 13px; color: ${navy.dark}; font-weight: 700; margin: 18px 0 8px; }

  .summary {
    background: ${navy.dark};
    color: ${colors.textInverse};
    border-radius: 14px;
    padding: 16px 18px;
  }
  .summary-label { font-size: 11px; color: ${home.colors.onNavyMuted}; margin: 0 0 4px; }
  .summary-total { font-size: 24px; font-weight: 800; margin: 0 0 14px; }
  .summary-grid { display: table; width: 100%; margin: 0; }
  /* Empat sel sejajar: jumlah transaksi, item terjual, Tunai, dan QRIS. */
  .summary-cell { display: table-cell; width: 25%; vertical-align: top; padding-right: 8px; }
  .summary-cell.half { width: 50%; }
  .summary-cell dt { font-size: 10px; color: ${home.colors.onNavyMuted}; margin: 0 0 2px; }
  .summary-cell dd { font-size: 14px; font-weight: 700; margin: 0 0 8px; }

  .facts { width: 100%; border-collapse: collapse; margin-top: 4px; }
  .facts td { padding: 5px 0; font-size: 12px; border-bottom: 1px solid ${navy.border}; }
  .facts td:last-child { text-align: right; font-weight: 700; }

  table.grid { width: 100%; border-collapse: collapse; }
  table.grid th {
    background: ${navy.tabActive};
    color: ${navy.dark};
    font-size: 10px;
    text-align: left;
    padding: 7px 8px;
    border-bottom: 1px solid ${navy.border};
  }
  table.grid td {
    padding: 6px 8px;
    font-size: 11px;
    border-bottom: 1px solid ${navy.border};
  }
  .num { text-align: right; }
  .empty { color: ${colors.textMuted}; font-style: italic; padding: 8px 0; }

  .meta {
    margin-top: 22px;
    padding-top: 10px;
    border-top: 1px dashed ${colors.textFaint};
    font-size: 10px;
    color: ${colors.textMuted};
  }
  .meta div { margin-bottom: 2px; }
  .meta .strong { color: ${navy.dark}; font-weight: 700; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
