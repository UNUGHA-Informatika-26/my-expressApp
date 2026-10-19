import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function signToken(userId: string): string {
  return jwt.sign({}, env.jwtSecret, {
    subject: userId,
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

/**
 * Verifikasi token. Mengembalikan id user jika sah,
 * atau null jika token tidak ada, rusak, atau kedaluwarsa.
 */
export function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    if (!decoded.sub || typeof decoded.sub !== 'string') {
      return null;
    }
    return decoded.sub;
  } catch {
    return null;
  }
}
