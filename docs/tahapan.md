# 05-tahapan.md — Fase Pengerjaan my_express

Aturan: satu fase satu sesi. Selesaikan, cek, commit Git, lalu fase berikutnya.
Backend lebih dulu; endpoint diuji (Postman) sebelum dipakai layar mobile.

---

## Fase 0 — Persiapan
- [ ] Buat folder `my_express/` dan `my_express_api/`
- [ ] Taruh `AGENTS.md` dan folder `docs/`
- [ ] Buat `docs/PROGRESS.md` (daftar fase + status)
- [ ] `git init` dan commit awal

**Selesai jika:** struktur folder dan dokumen ada, commit awal tercatat.

## Fase 1 — Backend: Setup, Database, Auth
- [ ] Inisialisasi Express + TypeScript, koneksi PostgreSQL via Sequelize
- [ ] File `.env` dan `.env.example` (`DATABASE_URL`, `JWT_SECRET`, `PORT`)
- [ ] Model dan tabel `users`
- [ ] Endpoint register, login (JWT), lihat dan edit profil
- [ ] Middleware auth JWT

**Selesai jika:** register, login, dan profil berhasil di Postman; password tersimpan ter-hash; endpoint profil menolak request tanpa token.

## Fase 2 — Mobile: Setup dan Akun
- [ ] Buat proyek Expo + TypeScript, pasang `expo-router`
- [ ] Setup `axios` (base URL dari `EXPO_PUBLIC_API_URL`), TanStack Query, Zustand
- [ ] Store auth + simpan token di `expo-secure-store`
- [ ] Layar daftar, login, logout, edit profil (form `react-hook-form` + `zod`)
- [ ] Navigasi tab (Beranda, Katalog, Kasir, Riwayat, Akun)

**Selesai jika:** di HP, daftar, login, logout, dan edit profil berjalan; sesi tetap ada setelah aplikasi dibuka ulang.

## Fase 3 — Katalog dan Produk Baru
- [ ] Backend: model `products`, CRUD produk, cari berdasarkan nama atau barcode
- [ ] Mobile: daftar produk dengan indikator stok (aman, menipis, habis)
- [ ] Mobile: pencarian dan filter kategori
- [ ] Mobile: form Produk baru (barcode, nama, kategori, harga, stok awal, batas minimum)

**Selesai jika:** produk bisa ditambah, diubah, dihapus, dan dicari; barcode ganda ditolak.

## Fase 4 — Scan Barcode
- [ ] Izin kamera dan layar scan (`expo-camera`) + input kode manual
- [ ] Scan di form Produk baru mengisi kolom barcode
- [ ] Barcode belum terdaftar membuka form Produk baru dengan barcode terisi

**Selesai jika:** diuji di HP asli; barcode terbaca dan terisi otomatis.

## Fase 5 — Kasir dan Pembayaran
- [ ] Zustand: store keranjang (`tambah`, `ubahJumlah`, `hapus`, `kosongkan`)
- [ ] Tambah ke keranjang lewat scan dan katalog
- [ ] Layar kasir: metode bayar (Tunai, QRIS, Transfer), kembalian otomatis
- [ ] Backend: model `transactions` + `transaction_items`, endpoint checkout dengan `sequelize.transaction()`
- [ ] Tolak jika stok kurang atau uang tunai kurang
- [ ] Layar Pembayaran Berhasil (nomor transaksi, metode, total)
- [ ] Setelah sukses: kosongkan keranjang + `invalidateQueries`

**Selesai jika:** stok berkurang tepat setelah bayar; checkout yang gagal tidak mengubah stok; transaksi muncul di database.

## Fase 6 — Riwayat dan Beranda
- [ ] Backend: endpoint riwayat (per hari, filter metode bayar) dan ringkasan dashboard
- [ ] Mobile: Riwayat dengan total harian dan filter
- [ ] Mobile: Beranda (penjualan hari ini, banding kemarin, grafik 7 hari, stok menipis, transaksi terakhir)

**Selesai jika:** angka di Beranda dan Riwayat cocok dengan data transaksi yang dibuat.

## Fase 7 — Hutang Distributor
- [ ] Backend: model `distributors`, `debts`, `debt_payments`; endpoint daftar, tambah, bayar
- [ ] Mobile: daftar hutang (total, lewat tempo, jatuh tempo 7 hari, progres bayar)
- [ ] Mobile: tombol Bayar (catat pelunasan) dan filter Belum lunas, Lunas, Semua
- [ ] Peringatan hutang jatuh tempo di Beranda

**Selesai jika:** pelunasan mengurangi sisa hutang; status berubah Lunas saat sisa 0.

## Fase 8 — Notifikasi dan Unduh Laporan
- [ ] Layar Notifikasi (stok menipis/habis, hutang jatuh tempo) + angka di ikon lonceng
- [ ] Pengaturan notifikasi (Zustand `persist`) dan `expo-notifications`
- [ ] Unduh laporan transaksi dan stok (CSV) lewat `expo-file-system` + `expo-sharing`

**Selesai jika:** notifikasi muncul sesuai kondisi; file laporan bisa diunduh dan dibuka.

## Fase 9 — Uji Akhir dan Build APK
- [ ] Uji alur lengkap: barang masuk, jual, stok berkurang, hutang, laporan
- [ ] Deploy backend dan database online; ubah `EXPO_PUBLIC_API_URL`
- [ ] `eas build --platform android --profile preview`
- [ ] Pasang APK di HP dan uji ulang alur utama

**Selesai jika:** APK terpasang dan seluruh alur utama berjalan dengan backend online.
