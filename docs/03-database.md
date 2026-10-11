# 03-database.md — Skema Database my_express

PostgreSQL + Sequelize. Hanya tabel dan kolom di dokumen ini yang boleh dibuat. Mau menambah? Ubah dokumen ini dulu dan minta persetujuan.

## Aturan Umum
- Primary key: `id` UUID (`gen_random_uuid()`).
- Uang disimpan sebagai **INTEGER dalam Rupiah** (tanpa desimal).
- Semua tabel punya `created_at` dan `updated_at`.
- Data milik pemilik toko selalu punya `user_id`; **setiap query wajib difilter `user_id`**.
- Hari ("hari ini", "kemarin", grafik 7 hari) dihitung dengan zona waktu **Asia/Jakarta (WIB)**.

## Relasi
```
users ─┬─< products
       ├─< transactions ──< transaction_items >── products
       ├─< distributors ──< debts ──< debt_payments
       └─< debts
```

## Tabel

### users
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(100) | nama lengkap |
| email | VARCHAR(150) | unik |
| password_hash | VARCHAR(255) | hasil bcrypt |
| store_name | VARCHAR(100) | nullable, diisi di edit profil |
| phone | VARCHAR(20) | nullable |

### products
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users, wajib |
| barcode | VARCHAR(50) | wajib |
| name | VARCHAR(150) | wajib |
| category | VARCHAR(50) | wajib |
| price | INTEGER | harga jual, > 0 |
| stock | INTEGER | default 0, tidak boleh negatif |
| min_stock | INTEGER | batas minimum, default 0 |

Unik: `(user_id, barcode)`. Status stok **dihitung, tidak disimpan**: `habis` jika stock = 0; `menipis` jika stock ≤ min_stock; selain itu `aman`.

### transactions
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users |
| code | VARCHAR(30) | nomor transaksi, format `TRX-YYYYMMDD-0001` (urut per hari) |
| payment_method | ENUM | `tunai`, `qris`, `transfer` |
| total | INTEGER | total belanja |
| amount_received | INTEGER | nullable; hanya untuk tunai |
| change_amount | INTEGER | nullable; kembalian tunai |

Unik: `(user_id, code)`.

### transaction_items
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID | PK |
| transaction_id | UUID | FK → transactions, ON DELETE CASCADE |
| product_id | UUID | FK → products, ON DELETE SET NULL |
| product_name | VARCHAR(150) | salinan nama saat transaksi |
| price | INTEGER | salinan harga saat transaksi |
| quantity | INTEGER | > 0 |
| subtotal | INTEGER | price × quantity |

Nama dan harga disalin agar riwayat tidak berubah ketika produk diedit atau dihapus.

### distributors
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users |
| name | VARCHAR(100) | wajib |
| phone | VARCHAR(20) | nullable |

### debts
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users |
| distributor_id | UUID | FK → distributors |
| invoice_number | VARCHAR(50) | nomor faktur |
| total_amount | INTEGER | total hutang, > 0 |
| paid_amount | INTEGER | default 0 |
| due_date | DATE | jatuh tempo |
| status | ENUM | `belum_lunas` (default), `lunas` |

Dihitung, tidak disimpan: sisa hutang = `total_amount - paid_amount`; **lewat tempo** = `belum_lunas` dan `due_date` sebelum hari ini; **segera jatuh tempo** = `belum_lunas` dan `due_date` dalam 7 hari ke depan.

### debt_payments
| Kolom | Tipe | Catatan |
|---|---|---|
| id | UUID | PK |
| debt_id | UUID | FK → debts, ON DELETE CASCADE |
| amount | INTEGER | > 0, tidak boleh melebihi sisa hutang |
| paid_at | TIMESTAMP | default sekarang |
| note | VARCHAR(200) | nullable |

## Tidak Ada Tabelnya
- **Notifikasi:** dihitung dari data stok dan hutang.
- **Pengaturan notifikasi:** disimpan di aplikasi (Zustand `persist`).
- **Keranjang:** hanya di aplikasi (Zustand), baru tersimpan saat checkout.

## Aturan Data Penting
- Checkout (insert transaksi, insert item, kurangi stok) dalam **satu `sequelize.transaction()`**; gagal berarti rollback. Kunci baris produk (`lock: transaction.LOCK.UPDATE`) agar stok tidak minus.
- Pembayaran hutang (insert pembayaran, tambah `paid_amount`, ubah status) juga dalam satu transaksi database. `status` jadi `lunas` jika `paid_amount` = `total_amount`.
- Harga di transaksi diambil dari tabel `products`, bukan dari kiriman aplikasi.
