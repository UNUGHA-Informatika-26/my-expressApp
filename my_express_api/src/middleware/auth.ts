import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/token';

/**
 * Middleware auth JWT.
 * Membaca header `Authorization: Bearer <token>`,
 * lalu melampirkan userId ke request jika token sah.
 * Token tidak ada atau salah → 401.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token belum diberikan' });
    return;
  }

  const token = header.slice('Bearer '.length);
  const userId = verifyToken(token);

  if (!userId) {
    res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
    return;
  }

  req.userId = userId;
  next();
}
