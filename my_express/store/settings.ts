import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorage } from '../lib/storage';

/** Tiga sakelar notifikasi di halaman Akun (konsep.md bagian 11). */
export type NotificationToggleKey = 'stokMenipis' | 'hutangJatuhTempo' | 'ringkasanPenjualan';

/**
 * Batas jumlah id "sudah diberitahu" yang disimpan.
 *
 * Beberapa rilis iOS menolak nilai SecureStore di atas ±2048 byte, dan tiap
 * id berisi satu UUID (±36 karakter). 30 id masih jauh di bawah batas itu.
 * ID yang terlempar hanya akan diberitahu lagi jika peringatannya muncul
 * kembali setelah sempat hilang — itu memang kabar baru.
 */
const MAX_NOTIFIED_IDS = 30;

interface SettingsState {
  /** Peringatan stok menipis dan habis. */
  stokMenipis: boolean;
  /** Peringatan hutang lewat tempo dan jatuh tempo 7 hari. */
  hutangJatuhTempo: boolean;
  /** Notifikasi terjadwal tiap malam berisi total penjualan hari ini. */
  ringkasanPenjualan: boolean;

  /**
   * Id peringatan yang sudah pernah dibacakan, supaya notifikasi lokal
   * tidak berulang setiap kali data dimuat ulang. Batas: MAX_NOTIFIED_IDS.
   */
  notifiedIds: string[];

  /** Nyalakan atau matikan satu sakelar. */
  setToggle: (key: NotificationToggleKey, value: boolean) => void;
  /** Tandai id-id ini sudah pernah diberitahu (id baru disisipkan di depan). */
  markNotified: (ids: string[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      stokMenipis: true,
      hutangJatuhTempo: true,
      ringkasanPenjualan: false,
      notifiedIds: [],

      setToggle: (key, value) => {
        // Ditulis eksplisit per kunci agar tipe tetap ketat tanpa cast.
        if (key === 'stokMenipis') {
          set({ stokMenipis: value });
        } else if (key === 'hutangJatuhTempo') {
          set({ hutangJatuhTempo: value });
        } else {
          set({ ringkasanPenjualan: value });
        }
      },

      markNotified: (ids) =>
        set((state) => {
          if (ids.length === 0) {
            return state;
          }
          const merged = [...ids, ...state.notifiedIds.filter((id) => !ids.includes(id))];
          return { notifiedIds: merged.slice(0, MAX_NOTIFIED_IDS) };
        }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
