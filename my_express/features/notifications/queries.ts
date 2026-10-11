import { useQuery } from '@tanstack/react-query';
import { listNotifications } from './api';

/** Kunci query fitur notifikasi. */
export const notificationKeys = {
  list: ['notifications'] as const,
};

/**
 * Peringatan stok dan hutang.
 * Data server dikelola TanStack Query, bukan Zustand (AGENTS.md).
 */
export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: listNotifications,
    // Lonceng di header beranda harus ikut ter-update selama aplikasi terbuka.
    refetchInterval: 60_000,
  });
}
