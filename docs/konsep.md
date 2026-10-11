# 01-konsep.md — Konsep Aplikasi my_express

## Gambaran Umum
**my_express** adalah aplikasi kasir (Point of Sale) berbasis mobile untuk toko alat tulis (ATK). Pemilik toko bisa mencatat penjualan, mengelola stok, dan memantau hutang ke distributor lewat satu aplikasi di HP. Scan barcode mempercepat pencatatan barang dan transaksi serta mengurangi salah ketik.

- **Pengguna:** pemilik atau kasir toko ATK.
- **Masalah yang diselesaikan:** pencatatan manual yang lambat, stok tidak terpantau, dan hutang distributor terlewat jatuh tempo.
- **Desain:** Figma "My_Express" (13 layar, sudah ada prototipenya).

## Fitur

### 1. Akun
- Daftar: nama lengkap, email, kata sandi (minimal 8 karakter, huruf dan angka, dengan konfirmasi)
- Login: email dan kata sandi, tautan "Lupa kata sandi"
- Logout: lewat halaman Akun
- Edit profil: nama, nama toko, email, nomor telepon

### 2. Beranda (Dashboard)
- Total penjualan hari ini, grafik 7 hari, perbandingan dengan kemarin
- Jumlah transaksi, item terjual, jumlah stok menipis
- Daftar barang perlu restok dan transaksi terakhir
- Peringatan hutang yang segera jatuh tempo
- Tombol cepat untuk transaksi baru

### 3. Notifikasi
Peringatan stok (menipis atau habis) dan hutang distributor jatuh tempo. Jumlahnya tampil sebagai angka di ikon lonceng.

### 4. Katalog dan Stok
- Daftar produk: nama, barcode, harga jual, stok
- Indikator warna: stok aman, menipis, habis
- Pencarian berdasarkan nama atau barcode, filter kategori
- Tombol + menambahkan produk ke keranjang kasir

### 5. Scan Barcode
- Pindai dengan kamera HP, atau ketik kode manual
- Di Kasir: barang terbaca langsung masuk keranjang
- Barcode belum terdaftar: buka form Produk baru dengan barcode terisi

### 6. Produk Baru
Form: barcode (bisa di-scan), nama, kategori, harga jual, stok awal, batas minimum stok. Batas minimum memicu peringatan "stok menipis".

### 7. Kasir
- Keranjang: jumlah bisa diubah atau dihapus
- Barang ditambah lewat scan atau katalog
- Metode bayar: Tunai, QRIS, Transfer; kembalian tunai dihitung otomatis
- Setelah selesai: stok berkurang otomatis, transaksi tersimpan di riwayat
- Transaksi ditolak jika stok tidak cukup atau uang yang diterima kurang

### 8. Pembayaran Berhasil
Konfirmasi: nomor transaksi, metode bayar, total. Dari sini bisa mulai transaksi baru atau buka riwayat.

### 9. Riwayat dan Laporan
- Penjualan dikelompokkan per hari, dengan total harian
- Filter berdasarkan metode bayar
- Laporan bisa diunduh

### 10. Hutang Distributor
- Total hutang berjalan, jumlah lewat tempo, dan jatuh tempo dalam 7 hari
- Tiap tagihan: nama distributor, nomor faktur, sisa hutang, progres pembayaran, tanggal jatuh tempo
- Tombol Bayar untuk mencatat pelunasan; filter Belum lunas, Lunas, Semua

### 11. Pengaturan Notifikasi dan Unduh Data
Di halaman Akun: nyalakan atau matikan notifikasi (stok menipis, jatuh tempo hutang, ringkasan penjualan) dan unduh laporan transaksi serta stok.

## Alur Kerja
1. Barang datang dari distributor, dicatat lewat **Produk baru** (scan barcode). Jika belum dibayar, dicatat di **Hutang**.
2. Barang dijual lewat **Kasir** (scan atau pilih dari katalog).
3. **Stok** berkurang otomatis; jika menipis muncul di **Notifikasi**.
4. Hasil penjualan dipantau di **Beranda** dan **Riwayat**.

## Aturan Bisnis
- Barcode unik per pemilik toko.
- Checkout bersifat atomik: stok berkurang dan transaksi tersimpan bersamaan, atau tidak sama sekali.
- Transaksi ditolak jika stok tidak cukup atau uang tunai kurang.
- Stok dianggap menipis jika jumlahnya sama atau di bawah batas minimum produk.
- Tiap pemilik toko hanya melihat datanya sendiri.
- QRIS dan Transfer hanya dicatat sebagai metode bayar; kasir memastikan sendiri uangnya masuk.

## Di Luar Cakupan
Printer struk, pembayaran QRIS otomatis lewat payment gateway, dan banyak kasir dengan role berbeda.
