import { z } from 'zod';

/**
 * Aturan kata sandi mengikuti backend (docs/04-api.md):
 * minimal 8 karakter, mengandung huruf dan angka.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Kata sandi minimal 8 karakter')
  .regex(/[A-Za-z]/, 'Kata sandi harus mengandung huruf')
  .regex(/[0-9]/, 'Kata sandi harus mengandung angka');

export const loginSchema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Nama lengkap wajib diisi').max(100, 'Nama maksimal 100 karakter'),
    email: z.email('Email tidak valid').max(150, 'Email maksimal 150 karakter'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak sama',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  storeName: z.string().max(100, 'Nama toko maksimal 100 karakter').nullable(),
  email: z.email('Email tidak valid').max(150, 'Email maksimal 150 karakter'),
  phone: z
    .string()
    .max(20, 'Nomor telepon maksimal 20 karakter')
    .regex(/^[0-9+]*$/, 'Nomor telepon hanya boleh angka dan tanda plus')
    .nullable(),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
