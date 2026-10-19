// Penambahan properti userId pada request Express.
// Diisi oleh middleware auth setelah token berhasil diverifikasi.
// Import di bawah membuat file ini menjadi module, sehingga
// `declare module` berfungsi sebagai augmentasi, bukan pengganti.
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}
