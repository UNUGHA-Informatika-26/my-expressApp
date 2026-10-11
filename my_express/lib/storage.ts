import * as SecureStore from 'expo-secure-store';

/**
 * Bungkus expo-secure-store agar cocok dengan interface storage Zustand.
 * SecureStore hanya menyimpan string, jadi nilainya di-JSON-kan.
 *
 * Dipakai oleh store sesi login dan store pengaturan. AsyncStorage tidak
 * dipakai karena tidak tercantum di 02-teknologi.md, sedangkan persist
 * butuh storage yang tersimpan antar sesi — localStorage tidak ada di
 * React Native sehingga persist akan diam-diam tidak bekerja.
 *
 * Catatan ukuran: beberapa rilis iOS menolak nilai di atas ±2048 byte,
 * jadi store pengaturan membatasi jumlah id yang disimpan (lihat
 * store/settings.ts).
 */
export const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await SecureStore.getItemAsync(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};
