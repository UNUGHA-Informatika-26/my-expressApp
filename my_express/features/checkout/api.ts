import { api } from '../../lib/api';
import type { CheckoutResponse, Transaction } from '../../types/api';
import type { CheckoutPayload } from './validation';

/**
 * POST /api/transactions/checkout — bayar isi keranjang.
 * Berhasil 201; 422 jika stok kurang atau uang tunai kurang (04-api.md).
 */
export async function checkout(payload: CheckoutPayload): Promise<Transaction> {
  const { data } = await api.post<CheckoutResponse>('/api/transactions/checkout', payload);
  return data.data;
}
