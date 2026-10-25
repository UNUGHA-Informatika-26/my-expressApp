import { z } from 'zod';

/** Aturan kata sandi: minimal 8 karakter, mengandung huruf dan angka. */
export const passwordSchema = z
  .string()
  .min(8, 'Kata sandi minimal 8 karakter')
  .regex(/[A-Za-z]/, 'Kata sandi harus mengandung huruf')
  .regex(/[0-9]/, 'Kata sandi harus mengandung angka');

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Nama lengkap wajib diisi').max(100, 'Nama maksimal 100 karakter'),
    email: z.email('Email tidak valid').max(150, 'Email maksimal 150 karakter'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak sama dengan kata sandi',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  storeName: z
    .string()
    .max(100, 'Nama toko maksimal 100 karakter')
    .nullable()
    .optional(),
  email: z.email('Email tidak valid').max(150, 'Email maksimal 150 karakter'),
  phone: z
    .string()
    .max(20, 'Nomor telepon maksimal 20 karakter')
    .regex(/^[0-9+]*$/, 'Nomor telepon hanya boleh berisi angka dan tanda plus')
    .nullable()
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Hapus akun (DELETE /profile).
 *
 * Kata sandi sengaja TIDAK memakai `passwordSchema` — cukup wajib terisi.
 * Alasannya sama seperti `loginSchema`: sandi lama di database bisa saja dibuat
 * sebelum aturan 8 karakter ada, dan orang justru harus tetap bisa menghapus
 * akunnya. Kecocokan sandi diverifikasi controller terhadap hash di database,
 * bukan oleh bentuk isinya.
 */
export const deleteProfileSchema = z.object({
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export type DeleteProfileInput = z.infer<typeof deleteProfileSchema>;
