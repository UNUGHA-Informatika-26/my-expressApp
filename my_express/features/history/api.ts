import { api } from '../../lib/api';
import type {
  HistoryDay,
  HistoryResponse,
  PaymentMethod,
  Transaction,
  TransactionDetailResponse,
} from '../../types/api';

/** Filter opsional untuk GET /api/transactions (lihat 04-api.md). */
export interface HistoryFilter {
  paymentMethod?: PaymentMethod;
  /** Tanggal WIB format YYYY-MM-DD. */
  from?: string;
  /** Tanggal WIB format YYYY-MM-DD. */
  to?: string;
}

/**
 * GET /api/transactions — riwayat dikelompokkan per hari menurut WIB.
 * Hari terbaru berada di urutan paling atas.
 */
export async function listHistory(filter: HistoryFilter = {}): Promise<HistoryDay[]> {
  const { data } = await api.get<HistoryResponse>('/api/transactions', {
    params: {
      paymentMethod: filter.paymentMethod || undefined,
      from: filter.from || undefined,
      to: filter.to || undefined,
    },
  });
  return data.data;
}

/**
 * GET /api/transactions/:id — satu transaksi lengkap beserta itemnya.
 * Dipakai tampilan struk, baik dari layar pembayaran berhasil maupun riwayat.
 */
export async function getTransaction(id: string): Promise<Transaction> {
  const { data } = await api.get<TransactionDetailResponse>(`/api/transactions/${id}`);
  return data.data;
}
