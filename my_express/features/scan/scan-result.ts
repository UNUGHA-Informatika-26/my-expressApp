/**
 * Pengembalian hasil scan dari layar /scan ke layar pemanggil.
 *
 * Expo Router tidak bisa mengirim nilai kembali lewat `router.back()`,
 * jadi dipakai satu penerima hasil di memori.
 * Ini BUKAN state aplikasi — karena itu tidak memakai Zustand
 * (Zustand dibatasi untuk keranjang, sesi login, dan pengaturan notifikasi).
 *
 * Dipakai sekali pakai: layar pemanggil mendaftarkan penerima tepat sebelum
 * membuka /scan, dan layar /scan mengosongkannya setelah kode terbaca.
 */

type ScanHandler = (barcode: string) => void;

let handler: ScanHandler | null = null;

/** Daftarkan penerima hasil scan berikutnya. Dipanggil sebelum `router.push('/scan')`. */
export function registerScanHandler(next: ScanHandler): void {
  handler = next;
}

/**
 * Serahkan barcode ke penerima yang terdaftar, lalu kosongkan daftaran.
 * Jika tidak ada penerima, barcode diabaikan.
 */
export function deliverScanResult(barcode: string): void {
  const target = handler;
  handler = null;
  target?.(barcode);
}
