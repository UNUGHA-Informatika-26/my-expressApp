import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../../store/cart';
import type { Transaction } from '../../types/api';
import { checkout } from './api';
import type { CheckoutPayload } from './validation';

/**
 * Bayar keranjang.
 *
 * Setelah sukses (tugas Fase 5 dan 6):
 * 1. kosongkan keranjang (Zustand), lalu
 * 2. invalidateQueries — stok produk berubah (katalog), riwayat bertambah,
 *    dan angka beranda ikut berubah, jadi ketiganya diambil ulang dari server.
 */
export function useCheckout() {
  const queryClient = useQueryClient();
  const kosongkan = useCartStore((state) => state.kosongkan);

  return useMutation<Transaction, unknown, CheckoutPayload>({
    mutationFn: checkout,
    onSuccess: async () => {
      kosongkan();
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      await queryClient.invalidateQueries({ queryKey: ['history'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
