# AGENTS.md — Aturan Kerja untuk my_express

my_express adalah aplikasi kasir (POS) mobile untuk toko ATK: kasir dengan scan barcode, stok, riwayat, dan hutang distributor. Detail fitur ada di `docs/01-konsep.md`.

## Cara Bekerja
1. Awal sesi, baca `AGENTS.md` dan `docs/PROGRESS.md`.
2. Kerjakan **satu fase** dari `docs/05-tahapan.md`, tugas demi tugas, sesuai urutan.
3. Untuk fase kompleks, tulis rencana dulu dan tunggu persetujuan sebelum mengubah file.
4. Setelah fase selesai: jalankan pengecekan, perbarui `docs/PROGRESS.md`, lalu berhenti. Jangan lanjut ke fase berikutnya tanpa perintah.

## Stack (final, jangan diganti)
- Mobile: React Native (Expo) + TypeScript, `expo-router`
- Server state: TanStack Query
- Client state: Zustand (hanya keranjang, sesi login, pengaturan notifikasi)
- Backend: Node.js + Express, PostgreSQL, Sequelize, JWT + bcrypt, zod
- Scan barcode: `expo-camera`
- Form: `react-hook-form` + `zod`
- API: `axios`; token disimpan di `expo-secure-store`

Library lain hanya boleh dipakai jika tercantum di `docs/02-teknologi.md`. Butuh yang baru? **Tanya dulu.**

## Struktur Folder
```
my_express/          app/ components/ features/ lib/ store/ hooks/ types/
my_express_api/      src/models/ routes/ controllers/ middleware/ config/
```

## Larangan
- Jangan membuat endpoint, tabel, atau kolom di luar `docs/03-database.md` dan `docs/04-api.md`. Jika perlu, **ubah dokumen dulu** dan minta persetujuan.
- Jangan mengubah file di luar tugas yang sedang dikerjakan.
- Jangan menebak. Jika instruksi ambigu, bertanya.
- Jangan menyimpan data server (produk, transaksi, hutang) di Zustand; itu tugas TanStack Query.
- Jangan membuat kode palsu: data dummy permanen atau fungsi kosong yang dianggap selesai.
- Jangan menaruh rahasia (`JWT_SECRET`, `DATABASE_URL`) di kode atau di Git.

## Aturan Wajib
- Checkout memakai `sequelize.transaction()`: stok berkurang dan transaksi tersimpan dalam satu proses. Gagal berarti rollback.
- Setiap query data dibatasi `user_id` pemilik toko.
- Barcode unik per pemilik toko.
- Transaksi ditolak jika stok tidak cukup atau uang tunai kurang.
- Setelah checkout berhasil: kosongkan keranjang (Zustand), lalu `invalidateQueries`.
- Format uang lewat satu helper Rupiah di `lib/`.
- Metode bayar hanya Tunai, QRIS, Transfer (dicatat saja, tanpa payment gateway).

## Gaya Kode
- TypeScript ketat, tanpa `any`.
- Komponen kecil dan dipisah per fitur di `features/`.
- Nama file dan variabel konsisten; teks UI berbahasa Indonesia.
- Tangani loading dan error di setiap layar yang mengambil data.

## Pengecekan Sebelum Fase Dinyatakan Selesai
- `npx tsc --noEmit` tanpa error (mobile dan backend)
- Server dan aplikasi berjalan tanpa crash
- Kriteria "Selesai jika" di fase tersebut terpenuhi
- Laporkan hasil pengecekan; jangan klaim selesai tanpa menjalankannya

## Di Luar Cakupan
Printer struk, QRIS otomatis lewat payment gateway, dan banyak role kasir.
