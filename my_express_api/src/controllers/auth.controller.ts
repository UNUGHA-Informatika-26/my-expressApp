import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { signToken } from '../lib/token';
import { toPublicUser } from '../types/PublicUser';
import type { LoginInput, RegisterInput } from '../validators/auth.schemas';

/**
 * POST /api/auth/register
 * 201 → { data: { user, token } }
 * 409 → email sudah terdaftar
 */
export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;

  const existing = await User.findOne({ where: { email: input.email } });
  if (existing) {
    res.status(409).json({
      message: 'Email sudah terdaftar',
      errors: [{ field: 'email', message: 'Email sudah terdaftar' }],
    });
    return;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  const token = signToken(user.id);
  res.status(201).json({ data: { user: toPublicUser(user), token } });
}

/**
 * POST /api/auth/login
 * 200 → { data: { user, token } }
 * 401 → email atau kata sandi salah
 */
export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;

  const user = await User.scope('withPassword').findOne({
    where: { email: input.email },
  });

  // Pesan sengaja sama untuk email salah dan password salah
  // agar tidak membocorkan email mana yang terdaftar.
  if (!user || !user.passwordHash) {
    res.status(401).json({ message: 'Email atau kata sandi salah' });
    return;
  }

  const match = await bcrypt.compare(input.password, user.passwordHash);
  if (!match) {
    res.status(401).json({ message: 'Email atau kata sandi salah' });
    return;
  }

  const token = signToken(user.id);
  res.json({ data: { user: toPublicUser(user), token } });
}
