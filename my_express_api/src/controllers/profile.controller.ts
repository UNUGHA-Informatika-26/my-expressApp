import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { sequelize } from '../config/database';
import { Debt } from '../models/Debt';
import { Distributor } from '../models/Distributor';
import { Product } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { toPublicUser } from '../types/PublicUser';
import type { DeleteProfileInput, UpdateProfileInput } from '../validators/auth.schemas';

/**
 * GET /api/profile
 * 200 → profil milik pemilik toko dari token
 * 401 → tanpa token (ditangani middleware auth)
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = await User.findByPk(req.userId);

  if (!user) {
    res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    return;
  }

  res.json({ data: toPublicUser(user) });
}

/**
 * PUT /api/profile
 * 200 → profil tersimpan
 * 409 → email dipakai pengguna lain
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateProfileInput;

  const user = await User.findByPk(req.userId);
  if (!user) {
    res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    return;
  }

  // Cek email bentrok ke pengguna lain (email sendiri tetap boleh).
  const emailTaken = await User.findOne({ where: { email: input.email } });
  if (emailTaken && emailTaken.id !== user.id) {
    res.status(409).json({
      message: 'Email sudah dipakai pengguna lain',
      errors: [{ field: 'email', message: 'Email sudah dipakai pengguna lain' }],
    });
    return;
  }

  await user.update({
    name: input.name,
    email: input.email,
    storeName: input.storeName ?? null,
    phone: input.phone ?? null,
  });

  res.json({ data: toPublicUser(user) });
}

/**
 * DELETE /api/profile
 * 200 → akun beserta seluruh datanya terhapus
 * 401 → kata sandi salah
 * 404 → pengguna tidak ditemukan (token masih berlaku padahal akunnya sudah hilang)
 *
 * Tiga hal yang tidak boleh dilupakan:
 *
 * 1. `User.scope('withPassword')` — model memakai `defaultScope` yang
 *    MENGECUALIKAN `passwordHash`, jadi `findByPk` biasa tidak membawa hash
 *    untuk dibandingkan.
 * 2. Verifikasi sandi dijalankan SEBELUM ada baris yang disentuh. Bila sandi
 *    salah, tidak ada satu pun query penghapusan yang sempat berjalan.
 * 3. Urutan penghapusan menyesuaikan kenyataan bahwa TIDAK ADA foreign key
 *    yang menunjuk `users.id` (lihat 03-database.md), sehingga pemusnahan harus
 *    diurutkan sendiri — dan semuanya dalam SATU transaksi, jadi bila satu
 *    tahap gagal seluruhnya batal dan akun tidak setengah terhapus.
 *
 * Urutannya penting: `transactions` dulu supaya `transaction_items` ikut
 * `CASCADE`; `debts` sebelum `distributors` karena `debts.distributor_id`
 * memakai `ON DELETE SET NULL` (bila distributor duluan, hutang kehilangan
 * referensinya sebelum ikut terhapus).
 */
export async function deleteProfile(req: Request, res: Response): Promise<void> {
  const input = req.body as DeleteProfileInput;

  const user = await User.scope('withPassword').findByPk(req.userId);
  if (!user) {
    res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    return;
  }

  const match = await bcrypt.compare(input.password, user.passwordHash);
  if (!match) {
    res.status(401).json({
      message: 'Kata sandi salah',
      errors: [{ field: 'password', message: 'Kata sandi salah' }],
    });
    return;
  }

  const userId = user.id;

  await sequelize.transaction(async (t) => {
    await Transaction.destroy({ where: { userId }, transaction: t });
    await Debt.destroy({ where: { userId }, transaction: t });
    await Distributor.destroy({ where: { userId }, transaction: t });
    await Product.destroy({ where: { userId }, transaction: t });
    await User.destroy({ where: { id: userId }, transaction: t });
  });

  res.json({ message: 'Akun berhasil dihapus' });
}
