import type { Request, Response } from 'express';
import { Op, type WhereOptions } from 'sequelize';
import { sequelize } from '../config/database';
import { BusinessRuleError } from '../lib/errors';
import { toTransactionDetail, toTransactionSummary } from '../lib/transaction-view';
import { toWibDate, toWibDateCompact, wibDayEnd, wibDayStart } from '../lib/wib';
import { Product } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { TransactionItem } from '../models/TransactionItem';
import { User } from '../models/User';
import {
  listTransactionsQuerySchema,
  type CheckoutInput,
} from '../validators/transaction.schemas';

/**
 * POST /transactions/checkout
 *
 * Seluruh proses berjalan dalam SATU transaksi database:
 * kunci baris produk (FOR UPDATE) → cek stok → cek uang tunai →
 * buat nomor transaksi → simpan transaksi + item → kurangi stok → commit.
 * Gagal di mana pun berarti rollback, jadi stok tidak pernah berubah sebagian.
 */
export async function checkout(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  const input = req.body as CheckoutInput;

  try {
    const saved = await sequelize.transaction(async (t) => {
      // Kunci baris pemilik toko lebih dulu: dua checkout bersamaan untuk toko
      // yang sama harus antre, sehingga nomor transaksi tidak pernah bentrok.
      await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });

      // Kunci baris produk yang akan dijual supaya tidak dijual dua kali
      // bersamaan oleh kasir lain.
      const products = await Product.findAll({
        where: { id: input.items.map((item) => item.productId), userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const byId = new Map(products.map((product) => [product.id, product]));

      let total = 0;
      const lines: { product: Product; quantity: number }[] = [];

      for (const item of input.items) {
        const product = byId.get(item.productId);

        if (!product) {
          // Produk tidak ada atau bukan milik toko ini.
          throw new BusinessRuleError('Produk tidak ditemukan', 'items');
        }
        if (product.stock < item.quantity) {
          // 422: stok kurang, pesan menyebut produk yang kurang (04-api.md).
          throw new BusinessRuleError(
            `Stok ${product.name} tidak cukup (tersisa ${product.stock})`,
            'items',
          );
        }

        total += product.price * item.quantity;
        lines.push({ product, quantity: item.quantity });
      }

      let amountReceived: number | null = null;
      let changeAmount: number | null = null;

      if (input.paymentMethod === 'tunai') {
        amountReceived = input.amountReceived ?? 0;
        if (amountReceived < total) {
          // 422: uang tunai kurang dari total.
          throw new BusinessRuleError(
            `Uang tunai kurang. Total belanja ${total}, uang diterima ${amountReceived}`,
            'amountReceived',
          );
        }
        changeAmount = amountReceived - total;
      }

      // Nomor transaksi urut per hari untuk pemilik toko ini.
      // Baris pemilik toko sudah terkunci di atas, jadi penghitungan aman.
      const datePart = toWibDateCompact(new Date());
      const prefix = `TRX-${datePart}-`;
      const usedToday = await Transaction.count({
        where: { userId, code: { [Op.like]: `${prefix}%` } },
        transaction: t,
      });
      const code = `${prefix}${String(usedToday + 1).padStart(4, '0')}`;

      const transaction = await Transaction.create(
        {
          userId,
          code,
          paymentMethod: input.paymentMethod,
          total,
          amountReceived,
          changeAmount,
        },
        { transaction: t },
      );

      // Simpan item dengan salinan nama, satuan, dan harga saat ini
      // (03-database.md), lalu kurangi stok produk di baris yang sama yang
      // sudah terkunci.
      for (const line of lines) {
        await TransactionItem.create(
          {
            transactionId: transaction.id,
            productId: line.product.id,
            productName: line.product.name,
            satuan: line.product.satuan,
            price: line.product.price,
            quantity: line.quantity,
            subtotal: line.product.price * line.quantity,
          },
          { transaction: t },
        );

        line.product.stock -= line.quantity;
        await line.product.save({ transaction: t });
      }

      return transaction;
    });

    // Muat item untuk respons (di luar transaksi, sudah ter-commit).
    const items = await TransactionItem.findAll({
      where: { transactionId: saved.id },
      order: [['product_name', 'ASC']],
    });

    res.status(201).json({
      data: {
        id: saved.id,
        code: saved.code,
        paymentMethod: saved.paymentMethod,
        total: saved.total,
        amountReceived: saved.amountReceived,
        changeAmount: saved.changeAmount,
        createdAt: saved.createdAt,
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          satuan: item.satuan,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      },
    });
  } catch (error) {
    if (error instanceof BusinessRuleError) {
      res.status(422).json({
        message: error.message,
        errors: error.field ? [{ field: error.field, message: error.message }] : undefined,
      });
      return;
    }

    console.error('Checkout gagal:', error);
    res.status(500).json({ message: 'Gagal memproses transaksi' });
  }
}

/**
 * GET /transactions — riwayat transaksi milik pemilik toko, dikelompokkan
 * per hari menurut zona WIB (04-api.md).
 *
 * Query opsional: `from`, `to` (YYYY-MM-DD), `paymentMethod`.
 * Respons: { data: [{ date, total, count, transactions: [...] }] },
 * hari terbaru di urutan paling atas.
 */
export async function listTransactions(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  // Query divalidasi di sini, bukan lewat middleware: req.query Express 5
  // hanya bisa dibaca sehingga tidak bisa ditimpa hasil parse-nya.
  const parsed = listTransactionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    res.status(400).json({
      message: 'Parameter pencarian tidak valid',
      errors: [{ field: issue.path.join('.') || 'query', message: issue.message }],
    });
    return;
  }

  const { from, to, paymentMethod } = parsed.data;

  // Setiap batas waktu jadi kondisi terpisah lalu digabung dengan Op.and,
  // supaya rentang from..to bisa dipakai bersamaan.
  const conditions: WhereOptions[] = [{ userId }];
  if (from) {
    conditions.push({ createdAt: { [Op.gte]: wibDayStart(from) } });
  }
  if (to) {
    conditions.push({ createdAt: { [Op.lte]: wibDayEnd(to) } });
  }
  if (paymentMethod) {
    conditions.push({ paymentMethod });
  }

  try {
    const transactions = await Transaction.findAll({
      where: { [Op.and]: conditions },
      order: [['createdAt', 'DESC']],
    });

    // Kelompokkan per hari WIB. Map mempertahankan urutan sisipan,
    // sehingga hari terbaru otomatis berada di atas.
    const groups = new Map<string, Transaction[]>();
    for (const transaction of transactions) {
      const date = toWibDate(transaction.createdAt);
      const bucket = groups.get(date);
      if (bucket) {
        bucket.push(transaction);
      } else {
        groups.set(date, [transaction]);
      }
    }

    const data = Array.from(groups, ([date, list]) => ({
      date,
      total: list.reduce((sum, item) => sum + item.total, 0),
      count: list.length,
      transactions: list.map(toTransactionSummary),
    }));

    res.json({ data });
  } catch (error) {
    console.error('Mengambil riwayat gagal:', error);
    res.status(500).json({ message: 'Gagal mengambil riwayat transaksi' });
  }
}

/**
 * GET /transactions/:id — detail transaksi beserta itemnya (04-api.md).
 * 200 jika ketemu, 404 jika tidak ada atau bukan milik pemilik toko.
 *
 * Item diurutkan dengan cara yang sama seperti respons checkout (nama
 * produk menaik), supaya tampilan struk menampilkan urutan identik
 * baik dari layar pembayaran berhasil maupun dari riwayat.
 *
 * Fungsi ini hanya membaca — tidak menyentuh checkout, stok, maupun
 * penyimpanan transaksi.
 */
export async function getTransactionById(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  const transaction = await Transaction.findOne({
    where: { id: req.params.id, userId },
  });

  if (!transaction) {
    res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    return;
  }

  const items = await TransactionItem.findAll({
    where: { transactionId: transaction.id },
    order: [['product_name', 'ASC']],
  });

  res.json({ data: toTransactionDetail(transaction, items) });
}
