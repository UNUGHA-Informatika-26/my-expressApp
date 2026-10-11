/**
 * Tema tunggal my_express — SATU-SATUNYA sumber warna, jarak, radius, dan
 * ukuran huruf untuk seluruh aplikasi.
 *
 * Sebelum file ini ada, 33 warna hex ditulis tangan di 55 berkas layar, sehingga
 * kartu, chip, dan lencana yang seharusnya serupa tampil berbeda-beda. Aturan
 * sekarang: layar TIDAK boleh menulis hex atau angka gaya sendiri — ambil dari
 * sini. Kalau ada peran yang belum tersedia, tambahkan tokennya di sini dulu,
 * jangan menulis ulang angkanya.
 *
 * Palet TIDAK diubah: tetap biru–abu Tailwind seperti desain asli. Yang dirapikan
 * adalah penulisannya, plus penyatuan nilai nyaris kembar yang dulu tersembunyi
 * (mis. teks peringatan ada `#92400E` dan `#B45309`; keduanya kini satu token).
 *
 * Contoh pemakaian:
 *   import { colors, spacing, fontSize } from '../lib/theme';
 *   const styles = StyleSheet.create({
 *     card: {
 *       backgroundColor: colors.surface,
 *       borderColor: colors.border,
 *       padding: spacing.lg,
 *       fontSize: fontSize.body,
 *     },
 *   });
 */

/**
 * Warna, dinamai berdasarkan PERAN — bukan berdasarkan tampilan.
 * Memakai nama peran membuat satu perubahan warna langsung rata ke semua layar.
 */
export const colors = {
  // --- Latar & permukaan ---
  /** Latar dasar aplikasi. */
  background: '#F9FAFB',
  /** Permukaan kartu, bottom sheet, dan baris daftar. */
  surface: '#FFFFFF',
  /** Permukaan sekunder: latar chip non-aktif, batang progres, track sakelar. */
  surfaceMuted: '#F3F4F6',
  /** Tirai gelap di belakang modal. Dipakai bersama `opacity` di bawah. */
  overlay: '#000000',
  /** Tirai di belakang lembar bawah, sudah membawa alpha sehingga tidak perlu
   *  ditimpa `opacity` lagi. */
  scrim: 'rgba(0, 0, 0, 0.4)',

  // --- Garis ---
  /** Garis tipis pemisah kartu dan baris. */
  border: '#E5E7EB',
  /** Garis lebih tegas: kolom isian, pemisah kuat. */
  borderStrong: '#D1D5DB',
  /** Garis di atas permukaan gelap (bingkai kamera pada layar Pindai). */
  overlayBorder: '#4B5563',

  // --- Teks ---
  /** Teks utama: judul, nilai, angka. */
  text: '#111827',
  /** Teks sekunder: isi baris, keterangan pendek. */
  textSecondary: '#374151',
  /** Teks redup: keterangan, petunjuk, teks bantu. */
  textMuted: '#6B7280',
  /** Teks paling redup: placeholder kolom isian, label mati. */
  textFaint: '#9CA3AF',
  /** Teks di atas warna terang (tombol terisi, latar berwarna). */
  textInverse: '#FFFFFF',

  // --- Aksen utama (biru) ---
  primary: '#2563EB',
  /** Latar besar bertona biru: kartu petunjuk, petunjuk penggunaan. */
  primarySoft: '#EFF6FF',
  /** Latar kecil bertona biru: bulatan ikon, lencana. */
  primaryTint: '#DBEAFE',
  primaryBorder: '#BFDBFE',
  /** Teks di atas `primarySoft` / `primaryTint`. */
  primaryText: '#1E40AF',
  /** Biru pudar: batang grafik non-puncak, track sakelar aktif. */
  primaryMuted: '#93C5FD',

  // --- Bahaya (merah) ---
  danger: '#DC2626',
  /** Merah pekat untuk ikon di atas latar merah muda. */
  dangerDark: '#B91C1C',
  /** Latar besar bertona merah. Merah belum punya tingkat berbeda untuk
   *  elemen kecil, jadi keduanya memakai nilai yang sama. */
  dangerSoft: '#FEE2E2',
  /** Latar kecil bertona merah: lencana, bulatan ikon. */
  dangerTint: '#FEE2E2',
  dangerBorder: '#FECACA',
  /** Teks di atas `dangerSoft`. */
  dangerText: '#991B1B',

  // --- Sukses (hijau) ---
  success: '#059669',
  /** Latar besar bertona hijau: kartu "Lunas", petunjuk sukses. */
  successSoft: '#ECFDF5',
  /** Latar kecil bertona hijau: lencana stok "Aman". */
  successTint: '#DCFCE7',
  successBorder: '#A7F3D0',
  /** Teks di atas `successSoft`. */
  successText: '#166534',

  // --- Peringatan (kuning) ---
  warning: '#D97706',
  /** Latar besar bertona kuning: petunjuk nonaktif, kotak informasi. */
  warningSoft: '#FFFBEB',
  /** Latar kecil bertona kuning: lencana "Menipis", bulatan ikon. */
  warningTint: '#FEF3C7',
  warningBorder: '#FDE68A',
  /** Teks di atas `warningSoft`. */
  warningText: '#92400E',

  // --- Keadaan nonaktif ---
  /** Latar tombol dan kontrol yang dimatikan. */
  disabled: '#D1D5DB',
} as const;

/**
 * Skala jarak dengan dasar 4 piksel.
 * Angka yang dulu terpakai tapi di luar skala (3, 6, 7, 10, 14, 18) akan
 * dipindahkan ke langkah terdekat saat penataan, agar jarak antar layar
 * benar-benar seragam.
 */
export const spacing = {
  none: 0,
  /** Jarak sangat rapat: garis, bulatan ikon ke label. */
  hair: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

/**
 * Peran tata letak — jawaban untuk pertanyaan "seberapa jauh / seberapa lebar
 * elemen ini?". Layar memakai token ini, bukan angka, supaya satu keputusan
 * langsung rata ke seluruh aplikasi.
 */
export const layout = {
  /** Padding kiri-kanan konten setiap layar. */
  screenPadding: spacing.lg,
  /** Padding di dalam kartu. */
  cardPadding: spacing.lg,
  /** Jarak vertikal antar kartu atau antar baris daftar. */
  cardGap: spacing.md,
  /** Jarak antar bagian (judul bagian menuju isinya). */
  sectionGap: spacing.xxl,
  /** Tinggi minimum kolom isian dan tombol — sekaligus target sentuh minimum. */
  controlHeight: 48,
  /** Tinggi minimum baris daftar. */
  rowMinHeight: 56,
} as const;

/** Sudut membulat. `pill` untuk lencana dan chip. */
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  pill: 999,
} as const;

/**
 * Skala ukuran huruf — bilangan genap saja, supaya tidak lagi ada 15 dan 16
 * berdampingan tanpa perbedaan yang terlihat. Nilai yang dulu terpakai di
 * luar skala (11, 13, 15, 17, 19, 22, 30) dipindahkan ke langkah terdekat.
 */
export const fontSize = {
  /** Label kecil, lencana, teks bantu. */
  caption: 12,
  /** Teks biasa dan label kolom isian. */
  small: 14,
  /** Judul kartu dan isi daftar. */
  body: 16,
  /** Judul bagian kecil dan sub-judul. */
  subtitle: 18,
  /** Judul layar besar dan angka penting. */
  title: 20,
  /** Judul kelompok. */
  section: 24,
  /** Angka ringkasan. */
  display: 28,
  /** Angka utama pada Beranda. */
  hero: 32,
} as const;

/** Ketebalan huruf, sesuai nilai yang diterima React Native. */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Transparansi. Dulu dipakai 5 nilai berbeda (0.6–0.85) untuk hal yang sama. */
export const opacity = {
  /** Menekan tombol atau baris yang bisa disentuh. */
  pressed: 0.7,
  /** Kontrol yang dimatikan. */
  disabled: 0.5,
  /** Tinta paling redup untuk ilustrasi/maskot kosong. */
  muted: 0.6,
} as const;

/**
 * Gaya huruf yang berulang di banyak layar. Dipakai bersama `StyleSheet`,
 * mis. `style={[text.cardTitle, styles.jarakSendiri]}` — jaraknya diatur di
 * layar, bentuk hurufnya di sini.
 */
export const text = {
  /**
   * Judul di dalam kartu, lengkap dengan jarak ke isi di bawahnya.
   * Dulu ukurannya ada empat (15, 16, 18, 20) dan jaraknya tiga (0, 8, 16).
   */
  cardTitle: {
    fontSize: fontSize.subtitle,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  /** Judul baris atau sub-bagian dalam kartu. */
  rowTitle: { fontSize: fontSize.small, fontWeight: fontWeight.bold, color: colors.text },
  /** Keterangan redup: teks bantu, meta, keterangan sekunder. */
  muted: { fontSize: fontSize.small, color: colors.textMuted },
  /** Teks kesalahan. */
  error: { fontSize: fontSize.small, color: colors.danger },
  /** Keterangan di dalam latar berwarna. */
  onTint: { fontSize: fontSize.caption },
} as const;

/** Seluruh tema dalam satu objek, untuk impor singkat bila diperlukan. */
export const theme = {
  colors,
  spacing,
  layout,
  radius,
  fontSize,
  fontWeight,
  opacity,
  text,
} as const;

export type Theme = typeof theme;
