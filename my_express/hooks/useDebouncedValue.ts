import { useEffect, useState } from 'react';

/**
 * Tunda perubahan nilai sampai berhenti berubah sejenak.
 * Dipakai pencarian produk agar tidak memanggil API di setiap ketukan keyboard.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
