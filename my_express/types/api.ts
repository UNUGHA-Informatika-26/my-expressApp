/**
 * Tipe data yang diterima dari backend my_express_api.
 * Sumber kontrak: docs/04-api.md
 */

/** Data user yang aman dikirim ke klien (tanpa password_hash). */
export interface User {
  id: string;
  name: string;
  email: string;
  storeName: string | null;
  phone: string | null;
}

/** Respons sukses standar backend: { data: ... } */
export interface ApiResponse<T> {
  data: T;
}

/** Respons gagal backend: { message, errors? } */
export interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
}

/** Respons login dan register: { data: { user, token } } */
export type AuthResponse = ApiResponse<{ user: User; token: string }>;

/** Respons profil: { data: User } */
export type ProfileResponse = ApiResponse<User>;

/** Status stok dihitung di server, tidak disimpan (lihat 03-database.md). */
export type StockStatus = 'aman' | 'menipis' | 'habis';

/** Data produk sesuai 04-api.md, termasuk stockStatus hasil hitung server. */
export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  satuan: string;
  price: number;
  stock: number;
  minStock: number;
  stockStatus: StockStatus;
}

/** Respons daftar produk: { data: Product[] } */
export type ProductListResponse = ApiResponse<Product[]>;

/** Respons satu produk: { data: Product } */
export type ProductResponse = ApiResponse<Product>;

/** Respons daftar kategori: { data: string[] } */
export type CategoryListResponse = ApiResponse<string[]>;

/** Respons hapus: { message } */
export interface MessageResponse {
  message: string;
}

/** Metode bayar yang didukung (lihat 04-api.md). */
export type PaymentMethod = 'tunai' | 'qris' | 'transfer';

/**
 * Satu baris item transaksi; nama, satuan, dan harga adalah salinan saat
 * transaksi dibuat. `satuan` tidak pernah dikirim aplikasi — ia disalin
 * server dari produk (lihat docs/04-api.md bagian 3).
 */
export interface TransactionItem {
  id: string;
  productId: string | null;
  productName: string;
  satuan: string;
  price: number;
  quantity: number;
  subtotal: number;
}

/** Data transaksi hasil checkout (04-api.md). */
export interface Transaction {
  id: string;
  code: string;
  paymentMethod: PaymentMethod;
  total: number;
  amountReceived: number | null;
  changeAmount: number | null;
  createdAt: string;
  items: TransactionItem[];
}

/** Respons checkout: { data: Transaction } */
export type CheckoutResponse = ApiResponse<Transaction>;

/** Respons detail transaksi: { data: Transaction } — dipakai tampilan struk. */
export type TransactionDetailResponse = ApiResponse<Transaction>;

/** Isi keranjang: cukup untuk menghitung total dan mengirim checkout. */
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  /** Stok terakhir yang diketahui, dipakai untuk membatasi tombol +. */
  stock: number;
  /** Satuan pengukuran stok dan jumlah, disalin dari produk saat dimasukkan. */
  satuan: string;
}

/**
 * Ringkasan satu transaksi tanpa daftar item.
 * Dipakai daftar riwayat dan transaksi terakhir di beranda.
 */
export interface TransactionSummary {
  id: string;
  code: string;
  paymentMethod: PaymentMethod;
  total: number;
  amountReceived: number | null;
  changeAmount: number | null;
  createdAt: string;
}

/** Satu kelompok riwayat per hari (04-api.md). */
export interface HistoryDay {
  /** Tanggal WIB format YYYY-MM-DD. */
  date: string;
  total: number;
  count: number;
  transactions: TransactionSummary[];
}

/** Respons riwayat: { data: HistoryDay[] } */
export type HistoryResponse = ApiResponse<HistoryDay[]>;

/** Produk yang perlu restok (stok menipis atau habis) di beranda. */
export interface RestockItem {
  id: string;
  name: string;
  barcode: string;
  stock: number;
  minStock: number;
  satuan: string;
  price: number;
  stockStatus: StockStatus;
}

/** Satu titik pada grafik 7 hari. */
export interface ChartPoint {
  date: string;
  total: number;
}

/** Ringkasan beranda (04-api.md). */
export interface DashboardSummary {
  todaySales: number;
  yesterdaySales: number;
  transactionCount: number;
  itemsSold: number;
  lowStockCount: number;
  restockItems: RestockItem[];
  recentTransactions: TransactionSummary[];
  chart7Days: ChartPoint[];
  dueDebts: DueDebts;
}

/** Respons beranda: { data: DashboardSummary } */
export type DashboardResponse = ApiResponse<DashboardSummary>;

/** Status hutang sesuai 03-database.md: belum lunas atau lunas. */
export type DebtStatus = 'belum_lunas' | 'lunas';

/** Distributor; dipilih pada form tambah hutang. */
export interface Distributor {
  id: string;
  name: string;
  phone: string | null;
}

/** Respons daftar distributor: { data: Distributor[] } */
export type DistributorListResponse = ApiResponse<Distributor[]>;

/** Satu hutang lengkap dengan nilai yang dihitung server (04-api.md). */
export interface Debt {
  id: string;
  distributorId: string;
  distributorName: string | null;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  /** Dihitung server: totalAmount - paidAmount. */
  remaining: number;
  /** Jatuh tempo format YYYY-MM-DD. */
  dueDate: string;
  status: DebtStatus;
  /** Dihitung server: belum_lunas dan dueDate sebelum hari ini (WIB). */
  isOverdue: boolean;
  /** Dihitung server: belum_lunas dan dueDate dalam 7 hari ke depan. */
  isDueSoon: boolean;
}

/** Satu pembayaran pada riwayat sebuah hutang. */
export interface DebtPayment {
  id: string;
  amount: number;
  /** Waktu bayar ISO 8601. */
  paidAt: string;
  note: string | null;
}

/** Ringkasan seluruh hutang yang belum lunas; dihitung server. */
export interface DebtSummary {
  totalOutstanding: number;
  overdueAmount: number;
  dueIn7DaysAmount: number;
}

/** Respons daftar hutang: { data: { summary, items } } */
export type DebtListResponse = ApiResponse<{ summary: DebtSummary; items: Debt[] }>;

/** Detail satu hutang beserta riwayat pembayarannya. */
export type DebtDetail = Debt & { payments: DebtPayment[] };

/** Respons detail hutang: { data: DebtDetail } */
export type DebtDetailResponse = ApiResponse<DebtDetail>;

/** Hasil mencatat pembayaran: berisi pembayaran baru dan hutang terbaru. */
export type PayDebtResponse = ApiResponse<{ payment: DebtPayment; debt: Debt }>;

/** Peringatan hutang jatuh tempo di beranda (04-api.md). */
export interface DueDebts {
  overdueCount: number;
  overdueAmount: number;
  dueIn7DaysCount: number;
  dueIn7DaysAmount: number;
}

/** Jenis peringatan pada layar Notifikasi (04-api.md bagian 6). */
export type NotificationType = 'stok_habis' | 'stok_menipis' | 'hutang_jatuh_tempo';

/**
 * Satu baris notifikasi. Kolom `productId`/`stock`/`minStock` diisi untuk
 * peringatan stok; kolom `debtId`/`remaining`/`dueDate` untuk peringatan hutang.
 */
export interface NotificationItem {
  /** Kunci stabil; dipakai sebagai key FlatList dan penanda "sudah diberitahu". */
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Waktu perubahan terakhir, ISO 8601. */
  occurredAt: string;

  // Produk (type stok_*).
  productId?: string;
  productName?: string;
  barcode?: string;
  stock?: number;
  minStock?: number;
  /** Satuan pengukuran stok (pcs, rim, lembar, ...). */
  satuan?: string;

  // Hutang (type hutang_jatuh_tempo).
  debtId?: string;
  distributorName?: string | null;
  invoiceNumber?: string;
  /** Sisa hutang dalam Rupiah; tampilkan dengan formatRupiah. */
  remaining?: number;
  dueDate?: string;
  isOverdue?: boolean;
}

/** Respons notifikasi: { data: { count, items } }; count = angka di lonceng. */
export type NotificationListResponse = ApiResponse<{ count: number; items: NotificationItem[] }>;
