import type { Request, Response } from 'express';
import { Op, col, type WhereOptions, where as sequelizeWhere } from 'sequelize';
import { computeDebtFlags, DUE_SOON_DAYS } from '../lib/debt-view';
import { addWibDays, toWibDate } from '../lib/wib';
import { Debt } from '../models/Debt';
import { Distributor } from '../models/Distributor';
import { Product } from '../models/Product';

/**
 * Jenis peringatan sesuai 04-api.md bagian 6. Diurutkan dari yang paling
 * mendesak, sehingga urutan nilai = urutan tampil di layar Notifikasi.
 */
export type NotificationType = 'stok_habis' | 'stok_menipis' | 'hutang_jatuh_tempo';

/** Satu baris notifikasi untuk respons API. */
export interface NotificationItem {
  /** Kunci stabil untuk FlatList dan penanda "sudah diberitahu". */
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Waktu perubahan terakhir (stok terakhir diubah / hutang terakhir diubah). */
  occurredAt: Date;

  // Data terkait — produk (diisi untuk type stok_*).
  productId?: string;
  productName?: string;
  barcode?: string;
  stock?: number;
  minStock?: number;
  /** Satuan pengukuran stok (pcs, rim, lembar, ...). */
  satuan?: string;

  // Data terkait — hutang (diisi untuk type hutang_jatuh_tempo).
  debtId?: string;
  distributorName?: string | null;
  invoiceNumber?: string;
  /** Sisa hutang. Dalam Rupiah; diformat di aplikasi, bukan di server. */
  remaining?: number;
  dueDate?: string;
  isOverdue?: boolean;
}

/**
 * Batas pesan dikirim agar layar tidak banjir. Pemilik toko lebih mudah
 * menindak 20 baris pertama daripada ratusan; daftar lengkap tetap terlihat
 * di Katalog (filter status stok) dan di Hutang.
 */
const ITEM_LIMIT = 50;

/**
 * GET /notifications — peringatan stok dan hutang (04-api.md bagian 6).
 *
 * Notifikasi **diturunkan dari data toko**, bukan disimpan sebagai tabel baru:
 * stok menipis/habis berasal dari `products.stock <= min_stock`, dan hutang
 * mendesak berasal dari hutang belum lunas yang lewat tempo atau jatuh tempo
 * dalam 7 hari. Dengan begitu tidak ada baris yang harus disinkronkan dan
 * tidak ada endpoint tambahan di luar dokumen.
 *
 * `count` = jumlah item yang dikirim, dipakai sebagai angka di ikon lonceng.
 * Preferensi nyala/mati ditangani di aplikasi (04-api.md baris 94).
 */
export async function listNotifications(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  try {
    const today = toWibDate(new Date());
    const dueSoonLimit = addWibDays(today, DUE_SOON_DAYS);

    // Stok menipis ATAU habis. min_stock selalu >= 0, jadi `stock <= min_stock`
    // sudah mencakup produk yang stoknya 0 (pola yang sama dengan beranda).
    const stockConditions: WhereOptions[] = [
      { userId },
      sequelizeWhere(col('stock'), Op.lte, col('min_stock')),
    ];
    const restockProducts = await Product.findAll({
      where: { [Op.and]: stockConditions },
      order: [
        ['stock', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    // Hutang belum lunas; distributor ikut di-include agar nama tampil.
    const openDebts = await Debt.findAll({
      where: { userId, status: 'belum_lunas' },
      include: [{ model: Distributor, as: 'distributor' }],
    });

    const items: NotificationItem[] = [];

    for (const product of restockProducts) {
      const habis = product.stock <= 0;
      items.push({
        id: `${habis ? 'stok_habis' : 'stok_menipis'}:${product.id}`,
        type: habis ? 'stok_habis' : 'stok_menipis',
        title: habis ? 'Stok habis' : 'Stok menipis',
        message: habis
          ? `${product.name} sudah habis dan perlu segera dibeli.`
          : `${product.name} tersisa ${product.stock} ${product.satuan}, batas minimum ${product.minStock} ${product.satuan}.`,
        occurredAt: product.updatedAt,
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        stock: product.stock,
        minStock: product.minStock,
        satuan: product.satuan,
      });
    }

    for (const debt of openDebts) {
      const flags = computeDebtFlags(debt, today, dueSoonLimit);
      if (!flags.isOverdue && !flags.isDueSoon) {
        continue;
      }

      const name = debt.distributor?.name ?? 'Distributor tanpa nama';
      const overdue = flags.isOverdue;
      items.push({
        id: `hutang:${debt.id}`,
        type: 'hutang_jatuh_tempo',
        title: overdue ? 'Hutang lewat tempo' : 'Hutang jatuh tempo',
        message: overdue
          ? `Faktur ${debt.invoiceNumber} dari ${name} lewat tempo sejak ${debt.dueDate}.`
          : `Faktur ${debt.invoiceNumber} dari ${name} jatuh tempo ${debt.dueDate}.`,
        occurredAt: debt.updatedAt,
        debtId: debt.id,
        distributorName: debt.distributor?.name ?? null,
        invoiceNumber: debt.invoiceNumber,
        remaining: flags.remaining,
        dueDate: debt.dueDate,
        isOverdue: overdue,
      });
    }

    // Urutan paling mendesak dulu, lalu waktu terbaru. `type` sudah berupa
    // urutan keparahan, jadi cukup bandingkan lewat array indeks.
    const severity: Record<NotificationType, number> = {
      stok_habis: 0,
      stok_menipis: 1,
      hutang_jatuh_tempo: 2,
    };
    items.sort((a, b) => {
      const byType = severity[a.type] - severity[b.type];
      if (byType !== 0) return byType;
      return b.occurredAt.getTime() - a.occurredAt.getTime();
    });

    const visible = items.slice(0, ITEM_LIMIT);

    res.json({
      data: {
        count: visible.length,
        items: visible,
      },
    });
  } catch (error) {
    console.error('Mengambil notifikasi gagal:', error);
    res.status(500).json({ message: 'Gagal mengambil notifikasi' });
  }
}
