# PROGRESS.md — Catatan Kemajuan my_express

Dibaca di awal setiap sesi OpenCode. Perbarui setelah satu fase selesai dan lolos pengecekan. Jangan menandai selesai tanpa menjalankan pengecekan.

**Status:** belum | berjalan | selesai
**Fase saat ini:** Fase 1 (Backend: setup, database, auth)

## Daftar Fase

| Fase | Nama | Status | Commit | Tanggal |
|---|---|---|---|---|
| 0 | Persiapan | selesai | 2437dc8 | 2026-10-10 |
| 1 | Backend: setup, database, auth | belum | - | - |
| 2 | Mobile: setup dan akun | belum | - | - |
| 3 | Katalog dan Produk baru | belum | - | - |
| 4 | Scan barcode | belum | - | - |
| 5 | Kasir dan pembayaran | belum | - | - |
| 6 | Riwayat dan Beranda | belum | - | - |
| 7 | Hutang distributor | belum | - | - |
| 8 | Notifikasi dan unduh laporan | belum | - | - |
| 9 | Uji akhir dan build APK | belum | - | - |

## Catatan Fase

Isi setelah fase selesai: apa yang dikerjakan, hasil pengecekan, dan hal yang perlu diketahui sesi berikutnya.

### Fase 0
- Folder `my_express/` dan `my_express_api/` dibuat di root (kosong, menunggu fase masing-masing).
- `AGENTS.md` + `docs/` lengkap: konsep, teknologi, tahapan, 03-database, 04-api, PROGRESS.
- `git init` di root, `.gitignore` dibuat (jatuhkan `.env`, `node_modules`, build, editor). Commit awal `2437dc8`.
- Catatan teknis: pesan commit dibuat lewat file (`git commit -F`) karena wrapper shell di sesi OpenCode membuang tanda kutip pada argumen perintah.
- Hal penting untuk sesi berikutnya: semua rujukan dokumen kini bernomor (`01`–`05` di AGENTS.md merujuk file tanpa nomor kecuali 03/04; file aktual: konsep.md, teknologi.md, tahapan.md, 03-database.md, 04-api.md).

## Keputusan dan Perubahan Dokumen

Catat setiap perubahan pada `docs/03-database.md` atau `docs/04-api.md` (tabel, kolom, atau endpoint baru) beserta alasannya.

- (belum ada)

## Masalah Terbuka

Hal yang belum beres dan perlu ditangani di sesi berikutnya.

- (belum ada)
