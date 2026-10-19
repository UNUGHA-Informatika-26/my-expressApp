import type { Request, Response } from 'express';
import { Op, type WhereOptions } from 'sequelize';
import { reportFileName, toCsv, type CsvCell } from '../lib/csv';
import { toWibDate, toWibTime, wibDayEnd, wibDayStart } from '../lib/wib';
import { computeStockStatus, Product } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { TransactionItem } from '../models/TransactionItem';
import { reportTransactionsQuerySchema } from '../validators/report.schemas';

/**
 * Judul kolom laporan transaksi. Posisi ini menentukan urutan sel pada CSV,
 * jadi ubah bersamaan dengan baris data di bawah.
 */
const TRANSACTION_HEADERS: CsvCell[] = [
  'Tanggal',
  'Jam',
  'Kode',
  'Metode Bayar',
  'Jumlah Item',
  'Total',
  'Uang Diterima',
  'Kembalian',
];

/** Judul kolom laporan stok (04-api.md bagian 7). */
const STOCK_HEADERS: CsvCell[] = [
  'Barcode',
  'Nama',
  'Kategori',
  'Satuan',
  'Harga',
  'Stok',
  'Stok Minimum',
  'Status',
];

/** Label metode bayar yang dibaca pemilik toko (bukan kode internalnya). */
const PAYMENT_LABELS: Record<Transaction['paymentMethod'], string> = {
  tunai: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
};

/**
 * Kirim CSV ke respons dengan header unduhan.
 *
 * `charset=utf-8` wajib supaya klien tahu isi file UTF-8; `Content-Disposition:
 * attachment` membuat browser/Android menawarkan file, bukan menampilkannya.
 */
function sendCsv(res: Response, filename: string, csv: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

/**
 * GET /reports/transactions?from=&to= — laporan transaksi CSV (04-api.md bagian 7).
 *
 * Baris disusun **menaik** (paling awal di atas) agar mudah dibaca berurutan
 * di Excel, berbeda dengan riwayat di aplikasi yang terbaru di atas.
 *
 * Jumlah uang dikirim sebagai **angka bulat Rupiah** tanpa format, supaya Excel
 * menganggapnya sebagai angka dan bisa dijumlahkan. Format tampilan Rupiah
 * hanya milik aplikasi (04-api.md: uang dalam Rupiah integer).
 *
 * Baris terakhir adalah `TOTAL` berisi jumlah item dan penjumlahan seluruh
 * transaksi pada rentang tersebut.
 */
export async function reportTransactions(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  const parsed = reportTransactionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    res.status(400).json({
      message: 'Parameter laporan tidak valid',
      errors: [{ field: issue.path.join('.') || 'query', message: issue.message }],
    });
    return;
  }

  const { from, to } = parsed.data;

  const conditions: WhereOptions[] = [{ userId }];
  if (from) {
    conditions.push({ createdAt: { [Op.gte]: wibDayStart(from) } });
  }
  if (to) {
    conditions.push({ createdAt: { [Op.lte]: wibDayEnd(to) } });
  }

  try {
    const transactions = await Transaction.findAll({
      where: { [Op.and]: conditions },
      order: [['createdAt', 'ASC']],
    });

    // Jumlah item per transaksi dihitung sekali ambil, bukan query per baris.
    const quantityByTransaction = new Map<string, number>();
    if (transactions.length > 0) {
      const items = await TransactionItem.findAll({
        where: { transactionId: transactions.map((transaction) => transaction.id) },
      });
      for (const item of items) {
        quantityByTransaction.set(
          item.transactionId,
          (quantityByTransaction.get(item.transactionId) ?? 0) + item.quantity,
        );
      }
    }

    const rows: CsvCell[][] = [TRANSACTION_HEADERS];
    let grandTotal = 0;
    let grandQuantity = 0;

    for (const transaction of transactions) {
      const quantity = quantityByTransaction.get(transaction.id) ?? 0;
      grandTotal += transaction.total;
      grandQuantity += quantity;

      rows.push([
        toWibDate(transaction.createdAt),
        toWibTime(transaction.createdAt),
        transaction.code,
        PAYMENT_LABELS[transaction.paymentMethod],
        quantity,
        transaction.total,
        transaction.amountReceived,
        transaction.changeAmount,
      ]);
    }

    rows.push([
      '',
      '',
      'TOTAL',
      '',
      grandQuantity,
      grandTotal,
      '',
      '',
    ]);

    const extra = from || to ? `${from ?? 'awal'}-sampai-${to ?? 'akhir'}` : undefined;
    sendCsv(res, reportFileName('transaksi', extra), toCsv(rows));
  } catch (error) {
    console.error('Membuat laporan transaksi gagal:', error);
    res.status(500).json({ message: 'Gagal membuat laporan transaksi' });
  }
}

/**
 * GET /reports/stock — laporan stok saat ini (04-api.md bagian 7).
 *
 * Diurutkan stok menaik lalu nama, sehingga barang habis (stok 0) berada di
 * paling atas, disusul yang menipis, baru yang aman — urutan yang sama dengan
 * daftar restok di beranda.
 */
export async function reportStock(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  try {
    const products = await Product.findAll({
      where: { userId },
      order: [
        ['stock', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    const rows: CsvCell[][] = [STOCK_HEADERS];
    for (const product of products) {
      const status = computeStockStatus(product.stock, product.minStock);
      rows.push([
        product.barcode,
        product.name,
        product.category,
        product.satuan,
        product.price,
        product.stock,
        product.minStock,
        // Tampilan laporan: huruf besar di depan ("Habis", bukan "habis").
        status.charAt(0).toUpperCase() + status.slice(1),
      ]);
    }

    sendCsv(res, reportFileName('stok'), toCsv(rows));
  } catch (error) {
    console.error('Membuat laporan stok gagal:', error);
    res.status(500).json({ message: 'Gagal membuat laporan stok' });
  }
}
