import type { Request, Response } from 'express';
import { Op, col, type WhereOptions, where as sequelizeWhere } from 'sequelize';
import { computeDebtFlags, DUE_SOON_DAYS } from '../lib/debt-view';
import { toTransactionSummary } from '../lib/transaction-view';
import { addWibDays, toWibDate, wibDayStart } from '../lib/wib';
import { Debt } from '../models/Debt';
import { Product, computeStockStatus } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { TransactionItem } from '../models/TransactionItem';

/** Grafik mencakup hari ini dan 6 hari sebelumnya. */
const CHART_DAYS = 7;

/** Jumlah transaksi terakhir yang dikirim ke beranda. */
const RECENT_LIMIT = 5;

/**
 * Jumlah produk restok yang dikirim ke beranda.
 * Daftar lengkapnya tersedia di Katalog dengan filter status stok,
 * jadi beranda cukup menampilkan beberapa baris pertama.
 */
const RESTOCK_LIMIT = 5;

/**
 * GET /dashboard — ringkasan satu layar (04-api.md).
 *
 * Semua angka memakai hari menurut zona WIB (03-database.md).
 * `transactionCount` dan `itemsSold` dihitung untuk HARI INI, seperti
 * `todaySales` — beranda memang menampilkan penjualan hari ini.
 *
 * `dueDebts` menghitung lewat tempo dan jatuh tempo 7 hari dengan aturan
 * yang sama seperti daftar hutang (lib/debt-view), sehingga angkanya cocok.
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  try {
    const today = toWibDate(new Date());
    const yesterday = addWibDays(today, -1);
    const chartStart = addWibDays(today, -(CHART_DAYS - 1));

    // Satu ambil data transaksi menutup tiga kebutuhan sekaligus:
    // penjualan hari ini, penjualan kemarin, dan grafik 7 hari.
    // Kondisi dikumpulkan di array dulu seperti pola filter produk,
    // karena `createdAt` tidak termasuk interface atribut model.
    const rangeConditions: WhereOptions[] = [
      { userId },
      { createdAt: { [Op.gte]: wibDayStart(chartStart) } },
    ];
    const transactions = await Transaction.findAll({
      where: { [Op.and]: rangeConditions },
      order: [['createdAt', 'DESC']],
    });

    const todayTransactions = transactions.filter(
      (item) => toWibDate(item.createdAt) === today,
    );
    const yesterdayTransactions = transactions.filter(
      (item) => toWibDate(item.createdAt) === yesterday,
    );

    const todaySales = todayTransactions.reduce((sum, item) => sum + item.total, 0);
    const yesterdaySales = yesterdayTransactions.reduce((sum, item) => sum + item.total, 0);
    const transactionCount = todayTransactions.length;

    // Barang terjual hari ini = penjumlahan quantity seluruh item hari ini.
    let itemsSold = 0;
    if (todayTransactions.length > 0) {
      const sum = await TransactionItem.sum('quantity', {
        where: { transactionId: todayTransactions.map((item) => item.id) },
      });
      itemsSold = sum ?? 0;
    }

    // Stok menipis ATAU habis. Karena min_stock selalu >= 0, kondisi
    // `stock <= min_stock` sudah mencakup produk yang stoknya 0.
    const restockConditions: WhereOptions[] = [
      { userId },
      sequelizeWhere(col('stock'), Op.lte, col('min_stock')),
    ];
    const restockProducts = await Product.findAll({
      where: { [Op.and]: restockConditions },
      order: [
        ['stock', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    // Transaksi terakhir diambil terpisah agar tetap menampilkan data terbaru
    // walaupun toko tidak berjualan selama lebih dari 7 hari.
    const recentTransactions = await Transaction.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: RECENT_LIMIT,
    });

    // Hutang lewat tempo dan jatuh tempo 7 hari (peringatan di beranda).
    const openDebts = await Debt.findAll({
      where: { userId, status: 'belum_lunas' },
    });
    const dueSoonLimit = addWibDays(today, DUE_SOON_DAYS);
    const dueDebts = {
      overdueCount: 0,
      overdueAmount: 0,
      dueIn7DaysCount: 0,
      dueIn7DaysAmount: 0,
    };
    for (const debt of openDebts) {
      const flags = computeDebtFlags(debt, today, dueSoonLimit);
      if (flags.isOverdue) {
        dueDebts.overdueCount += 1;
        dueDebts.overdueAmount += flags.remaining;
      } else if (flags.isDueSoon) {
        dueDebts.dueIn7DaysCount += 1;
        dueDebts.dueIn7DaysAmount += flags.remaining;
      }
    }

    // Grafik 7 hari: hari pertama = hari paling awal, urut menaik.
    const totalByDate = new Map<string, number>();
    for (const item of transactions) {
      const date = toWibDate(item.createdAt);
      totalByDate.set(date, (totalByDate.get(date) ?? 0) + item.total);
    }
    const chart7Days = Array.from({ length: CHART_DAYS }, (_, index) => {
      const date = addWibDays(chartStart, index);
      return { date, total: totalByDate.get(date) ?? 0 };
    });

    res.json({
      data: {
        todaySales,
        yesterdaySales,
        transactionCount,
        itemsSold,
        lowStockCount: restockProducts.length,
        restockItems: restockProducts.slice(0, RESTOCK_LIMIT).map((product) => ({
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          stock: product.stock,
          minStock: product.minStock,
          satuan: product.satuan,
          price: product.price,
          stockStatus: computeStockStatus(product.stock, product.minStock),
        })),
        recentTransactions: recentTransactions.map(toTransactionSummary),
        chart7Days,
        dueDebts,
      },
    });
  } catch (error) {
    console.error('Mengambil dashboard gagal:', error);
    res.status(500).json({ message: 'Gagal mengambil ringkasan beranda' });
  }
}
