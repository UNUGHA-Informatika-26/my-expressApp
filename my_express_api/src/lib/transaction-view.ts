import type { Transaction } from '../models/Transaction';
import type { TransactionItem } from '../models/TransactionItem';

/**
 * Ringkasan satu transaksi tanpa daftar itemnya.
 * Dipakai oleh daftar riwayat dan transaksi terakhir di beranda
 * (keduanya tidak memerlukan rincian item).
 */
export interface TransactionSummary {
  id: string;
  code: string;
  paymentMethod: Transaction['paymentMethod'];
  total: number;
  amountReceived: number | null;
  changeAmount: number | null;
  createdAt: Date;
}

/** Ubah model transaksi menjadi ringkasan untuk respons API. */
export function toTransactionSummary(transaction: Transaction): TransactionSummary {
  return {
    id: transaction.id,
    code: transaction.code,
    paymentMethod: transaction.paymentMethod,
    total: transaction.total,
    amountReceived: transaction.amountReceived,
    changeAmount: transaction.changeAmount,
    createdAt: transaction.createdAt,
  };
}

/**
 * Satu baris item pada respons transaksi detail.
 * Bentuknya sama persis dengan item di respons checkout (04-api.md).
 */
export interface TransactionItemView {
  id: string;
  productId: string | null;
  productName: string;
  satuan: string;
  price: number;
  quantity: number;
  subtotal: number;
}

/**
 * Detail transaksi lengkap beserta itemnya — isi respons
 * GET /transactions/:id (04-api.md: "detail transaksi beserta item").
 *
 * Ia memakai ringkasan yang sama, hanya menambah `items`, sehingga bentuk
 * datanya identik dengan respons checkout. Layar struk karena itu bisa
 * memakai satu tipe saja untuk kedua rute itu.
 */
export interface TransactionDetail extends TransactionSummary {
  items: TransactionItemView[];
}

/** Ubah transaksi beserta itemnya menjadi detail untuk respons API. */
export function toTransactionDetail(
  transaction: Transaction,
  items: TransactionItem[],
): TransactionDetail {
  return {
    ...toTransactionSummary(transaction),
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      satuan: item.satuan,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
  };
}
