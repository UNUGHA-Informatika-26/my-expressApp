import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { formatDateTime } from '../../lib/date';

/**
 * Identitas laporan yang sedang dicetak.
 *
 * Setiap unduhan memperoleh nomor dan waktu cetak BARU — keduanya dibuat
 * tepat sebelum file dibuat, bukan disimpan, sehingga dua unduhan untuk
 * periode yang sama tidak pernah menghasilkan nomor yang sama.
 */

/** Singkatan jenis laporan, dipakai pada nomor laporan. */
export type ReportKind = 'PMS' | 'STK';

/** Judul laporan pada PDF, Excel, dan kepala layar unduhan. */
export const REPORT_TITLE: Record<ReportKind, string> = {
  PMS: 'Laporan Pemasukan',
  STK: 'Laporan Stok',
};

/** Kalimat wajib pada footer PDF dan baris metadata Excel. */
export const GENERATED_NOTE = 'Dihasilkan otomatis oleh my express';

export interface ReportMeta {
  /** Contoh: `LAP-PMS-20261016-140831-K7QF`. */
  number: string;
  /** Waktu cetak terbaca, contoh: `16 Okt 2026, 14:08`. */
  printedAt: string;
  /** Nama pengguna pembuat laporan. */
  printedBy: string;
  /** Keterangan periode, contoh: `7 hari — 10 Okt 2026 s.d. 16 Okt 2026`. */
  period: string;
}

/**
 * Empat karakter acak untuk nomor laporan.
 *
 * Huruf I, O, dan angka 0/1 sengaja ditinggalkan dari daftar agar nomor yang
 * dibaca ulang dari file tidak tertukar (I↔1, O↔0).
 */
const SUFFIX_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(): string {
  let suffix = '';
  for (let index = 0; index < 4; index += 1) {
    suffix += SUFFIX_ALPHABET.charAt(Math.floor(Math.random() * SUFFIX_ALPHABET.length));
  }
  return suffix;
}

/**
 * Susun identitas laporan pada saat ini.
 *
 * `now` bersifat opsional hanya agar fungsi bisa diuji tanpa mengubah jam;
 * pemanggilan normal tidak perlu mengirimnya, sehingga waktu cetak selalu
 * waktu sebenarnya.
 */
export function makeReportMeta(
  kind: ReportKind,
  printedBy: string,
  period: string,
  now: Dayjs = dayjs(),
): ReportMeta {
  const stamp = now.format('YYYYMMDD-HHmmss');
  return {
    number: `LAP-${kind}-${stamp}-${randomSuffix()}`,
    printedAt: formatDateTime(now.toISOString()),
    printedBy,
    period,
  };
}

/**
 * Nama berkas unduhan, `Laporan-Pemasukan-YYYY-MM-DD` atau
 * `Laporan-Stok-YYYY-MM-DD` — ekstensi ditambahkan pemanggil.
 */
export function reportFileBase(kind: ReportKind, now: Dayjs = dayjs()): string {
  const date = now.format('YYYY-MM-DD');
  return kind === 'PMS' ? `Laporan-Pemasukan-${date}` : `Laporan-Stok-${date}`;
}

/** Baris metadata identik untuk PDF dan Excel, urut sesuai ketentuan laporan. */
export function metadataRows(meta: ReportMeta): [string, string][] {
  return [
    ['Nomor laporan', meta.number],
    ['Waktu cetak', meta.printedAt],
    ['Dibuat oleh', meta.printedBy],
    ['Periode', meta.period],
    ['Keterangan', GENERATED_NOTE],
  ];
}
