import dayjs from 'dayjs';
import { formatShortDate } from '../../lib/date';

/**
 * Periode laporan Pemasukan.
 *
 * Semua tanggal memakai format WIB `YYYY-MM-DD` — format yang sama dengan
 * query `from`/`to` pada `GET /api/transactions` dan `GET /api/reports/transactions`
 * (docs/04-api.md), sehingga angka di layar dan isinya file unduhan diambil
 * dari rentang yang persis sama.
 */

export type PeriodKey = 'hari-ini' | '7-hari' | 'bulan-ini' | 'kustom';

/** Pilihan chip periode, sesuai urutan pada desain. */
export const PERIOD_CHIPS: { key: PeriodKey; label: string }[] = [
  { key: 'hari-ini', label: 'Hari ini' },
  { key: '7-hari', label: '7 hari' },
  { key: 'bulan-ini', label: 'Bulan ini' },
  { key: 'kustom', label: 'Kustom' },
];

/** Rentang tanggal untuk query; tanpa nilai berarti tanpa batas. */
export interface PeriodRange {
  from?: string;
  to?: string;
}

/** Isian tanggal pada periode Kustom (teks mentah dari pengguna). */
export interface CustomDates {
  from: string;
  to: string;
}

/** Hasil penerapan chip periode: rentang siap pakai atau sebab belum bisa dipakai. */
export interface ResolvedPeriod {
  /** Null bila periode Kustom belum lengkap atau rentangnya terbalik. */
  range: PeriodRange | null;
  /** Pesan yang ditampilkan bila `range` null. */
  error: string | null;
  /** Label terbaca untuk keterangan periode pada PDF dan Excel. */
  label: string;
}

/** Cocokkan bentuk `YYYY-MM-DD` saja. */
const ISO_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Apakah teks benar-benar sebuah tanggal `YYYY-MM-DD`.
 *
 * Uji bentuk saja tidak cukup: `dayjs` membulatkan tanggal yang tidak ada
 * (mis. `2026-02-31` jadi `2026-03-03`), jadi hasil format ulang harus sama
 * dengan masukannya.
 */
export function isIsoDate(value: string): boolean {
  if (!ISO_SHAPE.test(value)) {
    return false;
  }
  return dayjs(value).format('YYYY-MM-DD') === value;
}

/** Pesan untuk isian Kustom, atau null bila keduanya sah. */
export function customRangeError(from: string, to: string): string | null {
  if (!isIsoDate(from) || !isIsoDate(to)) {
    return 'Isi tanggal mulai dan selesai dengan format YYYY-MM-DD.';
  }
  if (dayjs(from).isAfter(dayjs(to))) {
    return 'Tanggal mulai tidak boleh melewati tanggal selesai.';
  }
  return null;
}

/** Terapkan chip periode menjadi rentang tanggal dan label keterangannya. */
export function resolvePeriod(key: PeriodKey, custom: CustomDates): ResolvedPeriod {
  const today = dayjs();

  if (key === 'kustom') {
    const error = customRangeError(custom.from, custom.to);
    if (error) {
      return { range: null, error, label: 'Kustom' };
    }
    return {
      range: { from: custom.from, to: custom.to },
      error: null,
      label: `${formatShortDate(custom.from)} s.d. ${formatShortDate(custom.to)}`,
    };
  }

  if (key === 'hari-ini') {
    const date = today.format('YYYY-MM-DD');
    return {
      range: { from: date, to: date },
      error: null,
      label: `Hari ini — ${formatShortDate(date)}`,
    };
  }

  if (key === '7-hari') {
    const from = today.subtract(6, 'day').format('YYYY-MM-DD');
    const to = today.format('YYYY-MM-DD');
    return {
      range: { from, to },
      error: null,
      label: `7 hari — ${formatShortDate(from)} s.d. ${formatShortDate(to)}`,
    };
  }

  const from = today.startOf('month').format('YYYY-MM-DD');
  const to = today.format('YYYY-MM-DD');
  return {
    range: { from, to },
    error: null,
    label: `Bulan ini — ${formatShortDate(from)} s.d. ${formatShortDate(to)}`,
  };
}
