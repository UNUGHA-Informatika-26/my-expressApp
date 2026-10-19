import type { z } from 'zod';
import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware validasi body memakai skema zod.
 * Jika gagal, langsung menjawab 400 dengan daftar error per field.
 * Jika lolos, hasil parse (data sudah bersih) menggantikan req.body.
 */
export function validateBody<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Data yang dikirim tidak valid',
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'body',
          message: issue.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
