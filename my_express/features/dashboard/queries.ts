import { useQuery } from '@tanstack/react-query';
import { getDashboard } from './api';

/**
 * Ambil ringkasan beranda (penjualan, grafik 7 hari, stok menipis,
 * transaksi terakhir).
 */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });
}
