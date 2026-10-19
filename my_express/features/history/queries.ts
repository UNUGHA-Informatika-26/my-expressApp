import { useQuery } from '@tanstack/react-query';
import { getTransaction, listHistory, type HistoryFilter } from './api';

/**
 * Ambil riwayat transaksi per hari.
 * Data server dikelola TanStack Query, bukan Zustand (AGENTS.md).
 *
 * `enabled` dipakai layar Laporan: saat periode Kustom belum lengkap
 * tidak ada rentang yang boleh dikirim, sehingga permintaan ditahan
 * alih-alih jatuh ke "seluruh riwayat".
 */
export function useHistory(filter: HistoryFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ['history', filter],
    queryFn: () => listHistory(filter),
    enabled,
  });
}

/**
 * Ambil satu transaksi lengkap, termasuk daftar itemnya, untuk tampilan struk.
 * Karena id transaksi selalu baru, kunci ini tidak perlu di-invalidate saat
 * checkout — layar struk selalu memuat miliknya sendiri.
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransaction(id),
    // Tidak menembak API saat id masih kosong.
    enabled: id.length > 0,
  });
}
