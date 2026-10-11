import { create } from 'zustand';
import type { CartItem, Product } from '../types/api';

/**
 * Keranjang belanja kasir (Fase 5).
 *
 * Satu-satunya state klien selain sesi login dan pengaturan notifikasi
 * yang boleh memakai Zustand (AGENTS.md). Data produk/transaksi/hutang
 * yang datang dari server tetap dikelola TanStack Query.
 *
 * Keranjang TIDAK dipersist: hilang saat aplikasi ditutup (keputusan fase ini).
 */
interface CartState {
  items: CartItem[];

  /** Tambah produk ke keranjang; jika sudah ada, jumlahnya ditambah 1. */
  tambah: (product: Product) => void;
  /** Ubah jumlah satu item. Nilai di luar 1..stok diabaikan. */
  ubahJumlah: (productId: string, quantity: number) => void;
  /** Hapus satu item dari keranjang. */
  hapus: (productId: string) => void;
  /** Kosongkan seluruh keranjang (dipanggil setelah checkout sukses). */
  kosongkan: () => void;
}

/** Total seluruh item di keranjang. */
export function countCart(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Total belanja (penjumlahan harga × jumlah). */
export function totalCart(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],

  tambah: (product) =>
    set((state) => {
      const existing = state.items.find((item) => item.productId === product.id);

      if (existing) {
        // Tidak boleh melebihi stok yang ada.
        if (existing.quantity >= product.stock) {
          return state;
        }
        return {
          items: state.items.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }

      if (product.stock <= 0) {
        return state;
      }

      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            stock: product.stock,
          },
        ],
      };
    }),

  ubahJumlah: (productId, quantity) =>
    set((state) => ({
      items: state.items
        .map((item) => {
          if (item.productId !== productId) {
            return item;
          }
          // Stok habis berarti item tidak lagi bisa dijual, jadi dikeluarkan.
          if (item.stock <= 0) {
            return { ...item, quantity: 0 };
          }
          // Jumlah minimal 1 dan maksimal stok yang terakhir diketahui.
          return { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) };
        })
        .filter((item) => item.quantity >= 1),
    })),

  hapus: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    })),

  kosongkan: () => set({ items: [] }),
}));
