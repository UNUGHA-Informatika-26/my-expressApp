/**
 * Satu-satunya helper format uang untuk seluruh aplikasi (aturan AGENTS.md).
 * Ditulis manual tanpa Intl agar pasti jalan di Hermes engine.
 */

/** Format angka jadi Rupiah, contoh: 3500 → "Rp3.500". */
export function formatRupiah(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();

  let grouped = '';
  for (let i = 0; i < digits.length; i++) {
    // Sisipkan titik setiap 3 digit dari kanan.
    if (i > 0 && (digits.length - i) % 3 === 0) {
      grouped += '.';
    }
    grouped += digits[i];
  }

  return `${sign}Rp${grouped}`;
}
