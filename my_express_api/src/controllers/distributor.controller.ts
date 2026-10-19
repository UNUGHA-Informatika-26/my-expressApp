import type { Request, Response } from 'express';
import { Distributor } from '../models/Distributor';
import type { CreateDistributorInput } from '../validators/debt.schemas';

/**
 * GET /api/distributors — daftar distributor milik pemilik toko, urut nama.
 * Dibutuhkan oleh form tambah hutang untuk memilih distributor.
 */
export async function listDistributors(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  try {
    const distributors = await Distributor.findAll({
      where: { userId },
      order: [['name', 'ASC']],
    });

    res.json({
      data: distributors.map((item) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
      })),
    });
  } catch (error) {
    console.error('Mengambil distributor gagal:', error);
    res.status(500).json({ message: 'Gagal mengambil daftar distributor' });
  }
}

/** POST /api/distributors — tambah distributor baru. */
export async function createDistributor(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  const input = req.body as CreateDistributorInput;

  try {
    const distributor = await Distributor.create({
      userId,
      name: input.name,
      // String kosong dikirim aplikasi bila kolom telepon dibiarkan kosong.
      phone: input.phone?.trim() ? input.phone.trim() : null,
    });

    res.status(201).json({
      data: {
        id: distributor.id,
        name: distributor.name,
        phone: distributor.phone,
      },
    });
  } catch (error) {
    console.error('Menambah distributor gagal:', error);
    res.status(500).json({ message: 'Gagal menambah distributor' });
  }
}
