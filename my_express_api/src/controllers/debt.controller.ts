import type { Request, Response } from 'express';
import { Op, type WhereOptions } from 'sequelize';
import { sequelize } from '../config/database';
import { computeDebtFlags, DUE_SOON_DAYS, toDebtView } from '../lib/debt-view';
import { BusinessRuleError, NotFoundError } from '../lib/errors';
import { addWibDays, toWibDate } from '../lib/wib';
import { Debt } from '../models/Debt';
import { DebtPayment } from '../models/DebtPayment';
import { Distributor } from '../models/Distributor';
import { User } from '../models/User';
import {
  listDebtsQuerySchema,
  type CreateDebtInput,
  type CreatePaymentInput,
} from '../validators/debt.schemas';

/**
 * GET /api/debts — daftar hutang milik pemilik toko.
 *
 * Query opsional `status` (`belum_lunas` / `lunas`) menyaring daftar `items`,
 * tetapi `summary` selalu dihitung dari SELURUH hutang yang belum lunas
 * supaya angka ringkasan tidak berubah ikut filter.
 */
export async function listDebts(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  // Query divalidasi di controller karena req.query Express 5 hanya bisa dibaca.
  const parsed = listDebtsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    res.status(400).json({
      message: 'Parameter pencarian tidak valid',
      errors: [{ field: issue.path.join('.') || 'query', message: issue.message }],
    });
    return;
  }

  const today = toWibDate(new Date());
  const dueSoonLimit = addWibDays(today, DUE_SOON_DAYS);

  const conditions: WhereOptions[] = [{ userId }];
  if (parsed.data.status) {
    conditions.push({ status: parsed.data.status });
  }

  try {
    const [debts, openDebts] = await Promise.all([
      Debt.findAll({
        where: { [Op.and]: conditions },
        include: [{ model: Distributor, as: 'distributor', attributes: ['name'] }],
        order: [['due_date', 'ASC']],
      }),
      // Ringkasan memakai seluruh hutang yang belum lunas, tanpa ikut filter.
      Debt.findAll({ where: { userId, status: 'belum_lunas' } }),
    ]);

    const summary = { totalOutstanding: 0, overdueAmount: 0, dueIn7DaysAmount: 0 };
    for (const debt of openDebts) {
      const flags = computeDebtFlags(debt, today, dueSoonLimit);
      summary.totalOutstanding += flags.remaining;
      if (flags.isOverdue) {
        summary.overdueAmount += flags.remaining;
      }
      if (flags.isDueSoon) {
        summary.dueIn7DaysAmount += flags.remaining;
      }
    }

    res.json({
      data: {
        summary,
        items: debts.map((debt) => toDebtView(debt, today, dueSoonLimit)),
      },
    });
  } catch (error) {
    console.error('Mengambil hutang gagal:', error);
    res.status(500).json({ message: 'Gagal mengambil daftar hutang' });
  }
}

/** POST /api/debts — catat hutang baru ke distributor. */
export async function createDebt(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  const input = req.body as CreateDebtInput;

  try {
    // Distributor harus milik pemilik toko ini; selain itu dijawab 404.
    const distributor = await Distributor.findOne({
      where: { id: input.distributorId, userId },
    });
    if (!distributor) {
      res.status(404).json({ message: 'Distributor tidak ditemukan' });
      return;
    }

    const debt = await Debt.create({
      userId,
      distributorId: distributor.id,
      invoiceNumber: input.invoiceNumber,
      totalAmount: input.totalAmount,
      dueDate: input.dueDate,
    });

    const today = toWibDate(new Date());
    const view = toDebtView(debt, today, addWibDays(today, DUE_SOON_DAYS));

    res.status(201).json({
      data: {
        ...view,
        distributorName: distributor.name,
      },
    });
  } catch (error) {
    console.error('Menambah hutang gagal:', error);
    res.status(500).json({ message: 'Gagal menambah hutang' });
  }
}

/** GET /api/debts/:id — detail satu hutang beserta riwayat pembayarannya. */
export async function getDebt(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  const today = toWibDate(new Date());
  const dueSoonLimit = addWibDays(today, DUE_SOON_DAYS);

  try {
    const debt = await Debt.findOne({
      where: { id: req.params.id, userId },
      include: [{ model: Distributor, as: 'distributor', attributes: ['name'] }],
    });

    if (!debt) {
      res.status(404).json({ message: 'Hutang tidak ditemukan' });
      return;
    }

    // Riwayat pembayaran diambil terpisah, bukan lewat include,
    // agar model Debt tidak perlu mengimpor DebtPayment (mencegah impor bundar).
    const payments = await DebtPayment.findAll({
      where: { debtId: debt.id },
      order: [['paid_at', 'DESC']],
    });

    res.json({
      data: {
        ...toDebtView(debt, today, dueSoonLimit),
        payments: payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          paidAt: payment.paidAt,
          note: payment.note,
        })),
      },
    });
  } catch (error) {
    console.error('Mengambil detail hutang gagal:', error);
    res.status(500).json({ message: 'Gagal mengambil detail hutang' });
  }
}

/**
 * POST /api/debts/:id/payments — catat pembayaran hutang.
 *
 * Dijalankan dalam SATU transaksi database (03-database.md baris 110):
 * simpan pembayaran → tambah paid_amount → ubah status jadi `lunas`
 * ketika sisa mencapai 0. Gagal di mana pun berarti rollback.
 *
 * Baris pemilik toko dan baris hutang dikunci (FOR UPDATE) supaya dua
 * pembayaran bersamaan tidak bisa sama-sama memakai sisa hutang terakhir.
 */
export async function payDebt(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  const input = req.body as CreatePaymentInput;

  try {
    const result = await sequelize.transaction(async (t) => {
      await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });

      const debt = await Debt.findOne({
        where: { id: req.params.id, userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!debt) {
        throw new NotFoundError('Hutang tidak ditemukan');
      }
      if (debt.status === 'lunas') {
        throw new BusinessRuleError('Hutang sudah lunas', 'amount');
      }

      const remaining = debt.totalAmount - debt.paidAmount;
      if (input.amount > remaining) {
        // 422: pembayaran melebihi sisa hutang (04-api.md).
        throw new BusinessRuleError(
          `Pembayaran melebihi sisa hutang. Sisa ${remaining}`,
          'amount',
        );
      }

      const payment = await DebtPayment.create(
        {
          debtId: debt.id,
          amount: input.amount,
          note: input.note?.trim() ? input.note.trim() : null,
        },
        { transaction: t },
      );

      debt.paidAmount += input.amount;
      // Sisa 0 berarti lunas (03-database.md baris 110).
      debt.status = debt.paidAmount >= debt.totalAmount ? 'lunas' : 'belum_lunas';
      await debt.save({ transaction: t });

      return { payment, debt };
    });

    const today = toWibDate(new Date());
    const view = toDebtView(result.debt, today, addWibDays(today, DUE_SOON_DAYS));

    res.status(201).json({
      data: {
        payment: {
          id: result.payment.id,
          amount: result.payment.amount,
          paidAt: result.payment.paidAt,
          note: result.payment.note,
        },
        debt: view,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }

    if (error instanceof BusinessRuleError) {
      res.status(422).json({
        message: error.message,
        errors: error.field ? [{ field: error.field, message: error.message }] : undefined,
      });
      return;
    }

    console.error('Mencatat pembayaran gagal:', error);
    res.status(500).json({ message: 'Gagal mencatat pembayaran' });
  }
}
