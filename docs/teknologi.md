# 02-teknologi.md — Teknologi dan Library my_express

Hanya library di dokumen ini yang boleh dipakai. Butuh yang lain? Tanya dulu.

## Stack Utama

| Bagian | Pilihan |
|---|---|
| Aplikasi mobile | React Native (Expo) + TypeScript |
| Server state | TanStack Query |
| Client state | Zustand (tanpa Redux) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Sequelize |
| Autentikasi | JWT + bcrypt |
| Build dan deploy | EAS Build (APK Android) |
| Desain | Figma "My_Express" (13 layar) |

## Library Mobile (my_express/)

| Kebutuhan | Library |
|---|---|
| Navigasi | `expo-router` |
| Scan barcode | `expo-camera` |
| Panggil API | `axios` |
| Simpan token login | `expo-secure-store` |
| Form dan validasi | `react-hook-form` + `zod` |
| Grafik 7 hari | `react-native-gifted-charts` |
| Format tanggal | `dayjs` |
| Notifikasi | `expo-notifications` |
| Unduh laporan (CSV) | `expo-file-system` + `expo-sharing` |
| Ikon | `@expo/vector-icons` |
| Server state | `@tanstack/react-query` |
| Client state | `zustand` |

## Library Backend (my_express_api/)

| Kebutuhan | Library |
|---|---|
| Server | `express`, `cors` |
| Database | `sequelize`, `pg` |
| Autentikasi | `jsonwebtoken`, `bcrypt` |
| Validasi | `zod` |
| Konfigurasi | `dotenv` |
| Pengembangan | `typescript`, `tsx` (atau `ts-node`), `nodemon` |

## Pembagian State Management

| Store / Query | Isi |
|---|---|
| Zustand: cart | item, jumlah, metode bayar, uang diterima |
| Zustand: auth | user dan sesi login |
| Zustand: settings (`persist`) | toggle notifikasi |
| TanStack Query | produk, transaksi, riwayat, hutang, dashboard |

Data server (produk, transaksi, hutang) tidak boleh disimpan di Zustand.

## Lingkungan Pengembangan
- Node.js LTS, Git, VS Code, OpenCode
- HP Android dengan Expo Go (barcode diuji di HP asli)
- PostgreSQL lokal untuk pengembangan
- Postman atau Thunder Client untuk uji API
- Akun Expo untuk EAS Build

## Konfigurasi
- Mobile `.env`: `EXPO_PUBLIC_API_URL`
- Backend `.env`: `DATABASE_URL`, `JWT_SECRET`, `PORT`
- Sediakan `.env.example` tanpa nilai rahasia; `.env` masuk `.gitignore`

## Izin Aplikasi
- Kamera (Android `CAMERA`, iOS `NSCameraUsageDescription`)
- Notifikasi

## Deploy

| Tahap | Cara |
|---|---|
| Pengembangan | Expo Go + backend dan PostgreSQL di laptop |
| Demo | Backend dan database online (database misalnya Neon), ubah `EXPO_PUBLIC_API_URL` |
| Build | `eas build --platform android --profile preview` |
| Bagikan | Link EAS, Google Drive, atau WhatsApp |
