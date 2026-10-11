import { useQuery } from '@tanstack/react-query';
import { listHistory, type HistoryFilter } from './api';

/**
 * Ambil riwayat transaksi per hari.
 * Data server dikelola TanStack Query, bukan Zustand (AGENTS.md).
 */
export function useHistory(filter: HistoryFilter = {}) {
  return useQuery({
    queryKey: ['history', filter],
    queryFn: () => listHistory(filter),
  });
}
