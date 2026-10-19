import type { Request, Response } from 'express';
import { User } from '../models/User';
import { toPublicUser } from '../types/PublicUser';
import type { UpdateProfileInput } from '../validators/auth.schemas';

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
