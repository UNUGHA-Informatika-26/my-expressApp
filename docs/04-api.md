# 04-api.md — Kontrak API my_express

Hanya endpoint di dokumen ini yang boleh dibuat. Mau menambah? Ubah dokumen ini dulu dan minta persetujuan.

## Aturan Umum
- Base URL: `/api`. Format JSON.
- Semua endpoint **butuh header** `Authorization: Bearer <token>`, kecuali `register` dan `login`.
- Berhasil: `{ "data": ... }`
- Gagal: `{ "message": "pesan singkat", "errors": [{ "field": "...", "message": "..." }] }` (`errors` opsional)
- Kode status: `200` ok, `201` dibuat, `400` input tidak valid, `401` belum login atau token salah, `404` tidak ditemukan, `409` konflik (email atau barcode sudah ada), `422` aturan bisnis dilanggar (stok kurang, uang kurang, bayar melebihi sisa hutang).
- Data selalu dibatasi pemilik toko dari token (`user_id`); data milik orang lain dijawab `404`.
- Uang dalam Rupiah (integer). Tanggal ISO 8601.

## 1. Akun

| Method | Path | Isi |
|---|---|---|
| POST | `/auth/register` | body: `name`, `email`, `password`, `confirmPassword` → `201` `{ user, token }` |
| POST | `/auth/login` | body: `email`, `password` → `{ user, token }` |
| GET | `/profile` | profil pengguna |
| PUT | `/profile` | body: `name`, `storeName`, `email`, `phone` |

Kata sandi: minimal 8 karakter, mengandung huruf dan angka. Logout cukup menghapus token di aplikasi (tanpa endpoint).

## 2. Produk

| Method | Path | Isi |
|---|---|---|
| GET | `/products` | query opsional: `search` (nama atau barcode), `category`, `stock` (`aman`/`menipis`/`habis`) |
| GET | `/products/categories` | daftar kategori yang dipakai |
| GET | `/products/barcode/:barcode` | `200` produk, atau `404` jika belum terdaftar |
| GET | `/products/:id` | detail produk |
| POST | `/products` | body: `barcode`, `name`, `category`, `price`, `stock`, `minStock` → `201`; barcode ganda `409` |
| PUT | `/products/:id` | ubah data produk (termasuk `stock` untuk barang masuk) |
| DELETE | `/products/:id` | hapus produk |

Setiap produk di respons memuat `stockStatus`: `aman`, `menipis`, atau `habis`.

## 3. Kasir dan Transaksi

| Method | Path | Isi |
|---|---|---|
| POST | `/transactions/checkout` | lihat di bawah |
| GET | `/transactions` | query: `from`, `to` (tanggal), `paymentMethod` |
| GET | `/transactions/:id` | detail transaksi beserta item |

**Checkout** — body:
```json
{
  "paymentMethod": "tunai",
  "amountReceived": 50000,
  "items": [{ "productId": "uuid", "quantity": 2 }]
}
```
- `amountReceived` wajib untuk `tunai`, diabaikan untuk `qris` dan `transfer`.
- Server menghitung harga dan total dari database, lalu menjalankan semuanya dalam satu transaksi database.
- Berhasil `201`: transaksi lengkap (`code`, `paymentMethod`, `total`, `amountReceived`, `changeAmount`, `items`, `createdAt`).
- `422` jika stok tidak cukup (respons menyebut produk yang kurang) atau uang tunai kurang dari total.

**Riwayat** — respons dikelompokkan per hari:
```json
{ "data": [{ "date": "2026-10-10", "total": 450000, "count": 12, "transactions": [ ... ] }] }
```

## 4. Dashboard

| Method | Path | Isi |
|---|---|---|
| GET | `/dashboard` | ringkasan satu layar |

Respons memuat: `todaySales`, `yesterdaySales`, `transactionCount`, `itemsSold`, `lowStockCount`, `restockItems` (barang menipis/habis), `recentTransactions`, `chart7Days` (`[{ date, total }]`), dan `dueDebts` (jumlah hutang lewat tempo dan jatuh tempo 7 hari).

## 5. Hutang Distributor

| Method | Path | Isi |
|---|---|---|
| GET | `/distributors` | daftar distributor |
| POST | `/distributors` | body: `name`, `phone` (opsional) → `201` |
| GET | `/debts` | query opsional: `status` (`belum_lunas`/`lunas`); tanpa query berarti semua |
| POST | `/debts` | body: `distributorId`, `invoiceNumber`, `totalAmount`, `dueDate` → `201` |
| GET | `/debts/:id` | detail hutang beserta riwayat pembayaran |
| POST | `/debts/:id/payments` | body: `amount`, `note` (opsional) → `201` |

- `GET /debts` mengembalikan `summary` (`totalOutstanding`, `overdueAmount`, `dueIn7DaysAmount`) dan `items`.
- Tiap item memuat nama distributor, `invoiceNumber`, `totalAmount`, `paidAmount`, `remaining`, `dueDate`, `status`, dan `isOverdue`.
- Pembayaran dengan `amount` melebihi sisa hutang ditolak `422`. Jika lunas, `status` menjadi `lunas`.

## 6. Notifikasi

| Method | Path | Isi |
|---|---|---|
| GET | `/notifications` | `{ count, items }` |

Tiap item punya `type` (`stok_menipis`, `stok_habis`, `hutang_jatuh_tempo`), `title`, dan data terkait (produk atau hutang). `count` dipakai untuk angka di ikon lonceng. Preferensi notifikasi (nyala atau mati) ditangani di aplikasi, bukan di server.

## 7. Laporan (Unduh)

| Method | Path | Isi |
|---|---|---|
| GET | `/reports/transactions` | query: `from`, `to`; respons CSV |
| GET | `/reports/stock` | respons CSV stok saat ini |

Respons berupa teks CSV (`Content-Type: text/csv`). Aplikasi menyimpannya dengan `expo-file-system` lalu membagikannya lewat `expo-sharing`.

## Tidak Ada Endpoint
- **Lupa kata sandi:** hanya tampilan tautan di layar login pada versi ini (pengiriman email tidak termasuk cakupan).
- **Logout:** tanpa endpoint.
