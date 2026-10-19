import { useQuery } from '@tanstack/react-query';
import { useHistory } from '../history/queries';
import type { HistoryDay, TransactionSummary } from '../../types/api';
import { fetchTransactionsReport } from './api';
import { parseCsv } from './csv';
import type { PeriodRange } from './period';

/**
 * Sumber angka tab Pemasukan.
 *
 * Dua permintaan ke server, keduanya lewat layanan yang sudah ada:
 * 1. `GET /api/transactions?from&to` — daftar transaksi beserta `id`-nya,
 *    dipakai kartu ringkasan DAN kartu "Riwayat transaksi" (yang menekan satu
 *    baris harus membuka struk, dan struk butuh `id`).
 * 2. `GET /api/reports/transactions?from&to` (CSV) — satu-satunya layanan yang
 *    memuat "Jumlah Item" per transaksi, karena riwayat JSON memang sengaja
 *    tidak membawa daftar item (`TransactionSummary`).
 *
 * Tidak ada angka yang dihitung dari state lokal; seluruhnya turunan data server.
 */

/** Kolom pada CSV laporan milik backend (docs/04-api.md bagian 7). */
const COL_ITEMS = 'Jumlah Item';
const COL_METHOD = 'Metode Bayar';

/** Metode bayar lama yang tidak lagi dipakai; barisnya dibuang dari laporan. */
const LEGACY_METHOD = 'transfer';

/** Jumlah baris transaksi yang ditampilkan di kartu "Riwayat transaksi". */
export const PREVIEW_LIMIT = 5;

/**
 * Buang transaksi bermetode `transfer` lalu HITUNG ULANG angka tiap hari.
 *
 * Pengambilan keputusan: pemilik toko hanya memakai Tunai dan QRIS, sehingga
 * sisa transaksi lama bermetode transfer tidak ikut ditampilkan maupun
 * dihitung — dengan begitu Total pemasukan selalu persis Tunai + QRIS.
 *
 * Baris TIDAK dihapus dari database dan tidak diubah; hanya tidak ikut
 * tampilan laporan ini.
 */
export function withoutTransfer(days: HistoryDay[]): HistoryDay[] {
  const kept: HistoryDay[] = [];

  for (const day of days) {
    const transactions = day.transactions.filter(
      (transaction) => transaction.paymentMethod !== LEGACY_METHOD,
    );
    if (transactions.length === 0) {
      continue;
    }
    kept.push({
      ...day,
      transactions,
      count: transactions.length,
      total: transactions.reduce((sum, transaction) => sum + transaction.total, 0),
    });
  }

  return kept;
}

/** Jumlahkan kolom "Jumlah Item" dari isi CSV, tanpa baris metode transfer. */
function countItemsSold(csv: string): number {
  const [header, ...rows] = parseCsv(csv);
  if (!header) {
    return 0;
  }

  const itemsIndex = header.indexOf(COL_ITEMS);
  const methodIndex = header.indexOf(COL_METHOD);
  if (itemsIndex === -1) {
    return 0;
  }

  let sum = 0;
  for (const row of rows) {
    const method = (row[methodIndex] ?? '').trim().toLowerCase();
    if (methodIndex !== -1 && method === LEGACY_METHOD) {
      continue;
    }
    const quantity = Number.parseInt((row[itemsIndex] ?? '').trim(), 10);
    if (Number.isFinite(quantity)) {
      sum += quantity;
    }
  }
  return sum;
}

/** Jumlah per metode, sengaja dipisah agar kedua kartu kecil diaudit dengan mudah. */
export interface MethodTotal {
  total: number;
  count: number;
}

export interface IncomeTotals {
  total: number;
  count: number;
  /** Null selama CSV laporan belum selesai diambil. */
  itemsSold: number | null;
  cash: MethodTotal;
  qris: MethodTotal;
}

export interface IncomeData {
  /** Riwayat periode terpilih tanpa metode transfer, hari terbaru di atas. */
  days: HistoryDay[];
  totals: IncomeTotals;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isRefetching: boolean;
  refetch: () => void;
}

/** Jumlahkan seluruh transaksi pada daftar hari; asumsi transfer sudah dibuang. */
function summarize(days: HistoryDay[], itemsSold: number | null): IncomeTotals {
  const totals: IncomeTotals = {
    total: 0,
    count: 0,
    itemsSold,
    cash: { total: 0, count: 0 },
    qris: { total: 0, count: 0 },
  };

  for (const day of days) {
    for (const transaction of day.transactions) {
      totals.total += transaction.total;
      totals.count += 1;

      const bucket = transaction.paymentMethod === 'tunai' ? totals.cash : totals.qris;
      bucket.total += transaction.total;
      bucket.count += 1;
    }
  }

  return totals;
}

/**
 * Ambil seluruh angka tab Pemasukan untuk satu periode.
 * `range` null (periode Kustom belum lengkap) menahan kedua permintaan.
 */
export function useIncome(range: PeriodRange | null): IncomeData {
  const enabled = range !== null;
  const history = useHistory({ from: range?.from, to: range?.to }, enabled);

  const items = useQuery({
    queryKey: ['report-items-sold', range],
    queryFn: async () => {
      const { csv } = await fetchTransactionsReport(range ?? {});
      return countItemsSold(csv);
    },
    enabled,
  });

  const days = withoutTransfer(history.data ?? []);
  const itemsSold = enabled ? (items.data ?? null) : null;

  return {
    days,
    totals: summarize(days, itemsSold),
    isLoading: enabled && (history.isLoading || items.isLoading),
    isError: history.isError || items.isError,
    error: history.error ?? items.error,
    isRefetching: history.isRefetching || items.isRefetching,
    refetch: () => {
      void history.refetch();
      void items.refetch();
    },
  };
}

/** Daftar transaksi datar, hari terbaru lalu transaksi terbaru di dalamnya. */
export function flattenDays(days: HistoryDay[]): TransactionSummary[] {
  return days.flatMap((day) => day.transactions);
}
