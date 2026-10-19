import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorage } from '../lib/storage';
import type { User } from '../types/api';

const TOKEN_KEY = 'my_express_token';
const USER_KEY = 'my_express_user';

interface AuthState {
  /** Token login. Null berarti belum login. */
  token: string | null;
  /** Data pemilik toko yang sedang login. */
  user: User | null;

  /** Simpan sesi login baru (hanya dipanggil setelah login sukses; pendaftaran TIDAK membuat sesi). */
  setSession: (token: string, user: User) => void;
  /** Perbarui data user tanpa mengubah token (dipakai setelah edit profil). */
  setUser: (user: User) => void;
  /** Hapus sesi (logout). */
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      // Hanya token dan user yang disimpan permanen.
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
