import { Platform } from 'react-native';

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

/**
 * Tema layar autentikasi (Daftar dan Masuk) — desain "Inventaris" berlatar navy.
 *
 * Palet `colors` di atas adalah palet lama aplikasi (biru–abu Tailwind) dan
 * TIDAK diubah, karena lebih dari 20 layar lain masih memakainya. Desain baru
 * untuk layar daftar-masuk memakai navy `#0D1B3E` dan biru `#1A50E8` yang jauh
 * berbeda, sehingga diberi namespace tersendiri supaya:
 *   1. tidak bercampur dengan palet lama yang sudah dipakai bersama, dan
 *   2. suatu saat bisa diratakan ke seluruh aplikasi tanpa mengubrak-abrik
 *      layar yang tampilannya sudah sesuai desain sekarang.
 *
 * Seluruh nilai di bawah ini adalah SATU-SATUNYA sumber untuk layar daftar.
 * Layar tidak boleh menulis angkanya sendiri.
 */
export const auth = {
  colors: {
    /** Latar layar: navy gelap. */
    background: '#0D1B3E',
    /** Biru utama: tombol Daftar, tautan, kotak logo. */
    primary: '#1A50E8',
    /** Kartu berisi formulir. */
    surface: '#FFFFFF',
    /** Latar kolom isian: biru sangat muda. */
    inputBackground: '#F4F7FE',
    /** Garis tipis di sekeliling kolom isian. */
    inputBorder: '#E3E9F5',
    /** Teks utama di dalam kartu: navy. */
    text: '#0D1B3E',
    /** Teks sekunder di dalam kartu: abu kebiruan. */
    textSecondary: '#6B7A99',
    /** Placeholder kolom isian. */
    placeholder: '#9AA6BF',
    /** Subjudul di atas kartu, mendarat di latar navy. */
    onDarkMuted: '#B9C6E2',
    /** Teks di atas latar navy atau tombol biru. */
    textInverse: '#FFFFFF',
    /** Garis dan pesan error validasi. */
    error: '#DC2626',
  },

  /** Jarak berbasis peran — jawaban untuk "seberapa jauh elemen ini". */
  spacing: {
    /** Sisi kotak logo. */
    brandBox: 34,
    /** Jarak kotak logo ke tulisan merek. */
    brandGap: 10,
    /** Jarak kiri-kanan layar tempat kartu berpijak. */
    screenPadding: 16,
    /** Jarak antar bagian besar (merek, judul, kartu). */
    blockGap: 16,
    /** Jarak subjudul ke kartu. */
    subtitleGap: 20,
    /** Jarak subjudul di dalam kartu ke kolom isian pertama. */
    formGap: 20,
    /** Jarak judul di dalam kartu ke subjudulnya. */
    titleGap: 4,
    /** Padding di dalam kartu formulir. */
    cardPadding: 20,
    /** Jarak antar kolom isian. */
    fieldGap: 14,
    /** Jarak label ke kolom isian di bawahnya. */
    labelGap: 8,
    /** Jarak ikon ke teks di dalam kolom isian. */
    iconGap: 10,
    /** Jarak teks bantu ke kolom isian di atasnya. */
    helperGap: 6,
    /** Jarak kartu ke tautan "Masuk" di bawahnya. */
    footerGap: 20,
    /** Tinggi kolom isian. */
    inputHeight: 46,
    /** Tinggi tombol Daftar. */
    buttonHeight: 48,
  },

  /** Sudut membulat sesuai desain. */
  radius: {
    /** Kotak logo. */
    brandBox: 14,
    /** Kolom isian. */
    input: 16,
    /** Tombol Daftar — bentuk pil. */
    button: 24,
    /** Kartu formulir. */
    card: 28,
  },

  /** Ukuran huruf layar daftar. */
  fontSize: {
    /** Teks bantu di bawah kata sandi dan teks persetujuan. */
    helper: 10,
    /** Tulisan merek "INVENTARIS". */
    brand: 11,
    /** Subjudul di atas kartu, judul di dalam kartu, dan label kolom. */
    small: 12,
    /** Teks isi kolom isian dan tautan "Masuk". */
    input: 13,
    /** Teks tombol Daftar. */
    button: 16,
    /** Judul di dalam kartu. */
    cardTitle: 24,
    /** Judul besar di atas kartu. */
    hero: 26,
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    /** Judul "Usaha rapi, mulai di sini." dan "Buat akun". */
    extraBold: '800',
  } as const,

  /**
   * Nama keluarga huruf Plus Jakarta Sans yang sudah dimuat lewat `expo-font`.
   * Dipasangkan dengan bobot yang sesuai, misalnya `extraBold` + `bold`.
   */
  fontFamily: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },

  /** Jarak antar huruf. */
  letterSpacing: {
    /** Tulisan merek, agar terlihat melebar seperti desain. */
    brand: 1.6,
  },
} as const;

/**
 * Palet navy bersama — dasar seluruh desain berlatar navy (Beranda sekarang;
 * layar daftar-masuk memakai palet serupa lewat `auth`).
 *
 * CATATAN KETERULANGAN: nilai `dark`, `background`, `border`, dan
 * `textSecondary` di bawah ini kebetulan sama persis dengan sebagian isi
 * `auth.colors` di atas. Keduanya sengaja TIDAK disatukan sekarang: layar
 * daftar sudah selesai dan disesuaikan dengan gambar, sehingga menyentuhnya
 * hanya demi menghapus empat literal berisiko merusak tampilan yang sudah
 * benar tanpa keuntungan nyata. Bila suatu saat palet ini dipakai bersama
 * luas, satukan keduanya di sini dan petakan ulang `auth.colors`.
 */
export const navy = {
  /** Navy paling gelap: teks utama, tombol "Mulai transaksi baru", ujung kanan gradasi. */
  dark: '#0D1B3E',
  /** Navy utama: kartu penjualan, tautan, ikon dan teks tab aktif. */
  main: '#1B3A82',
  /** Latar layar, biru sangat muda. */
  background: '#F4F7FE',
  /** Garis tipis di sekeliling kartu putih. */
  border: '#E3E9F5',
  /** Latar di belakang tab yang sedang aktif. */
  tabActive: '#E6ECF8',
  /** Teks sekunder di atas permukaan putih. */
  textSecondary: '#6B7A99',
} as const;

/**
 * Tema layar Beranda.
 *
 * Seluruh nilai di bawah ini adalah SATU-SATUNYA sumber untuk layar beranda.
 * Layar tidak boleh menulis warna, jarak, radius, atau ukuran huruf sendiri —
 * ambil dari sini, sesuai aturan pada komentar teratas berkas ini.
 */
export const home = {
  colors: {
    ...navy,
    /** Permukaan kartu putih. */
    surface: '#FFFFFF',
    /** Teks utama di atas permukaan putih. */
    text: navy.dark,

    // --- Banner peringatan hutang ---
    bannerBg: '#FFF9E0',
    bannerBorder: '#F6E7A4',
    bannerText: '#7A3B00',

    // --- Lencana stok restok ---
    /** Latar lencana "Sisa N" (stok menipis). */
    sisaBg: '#FFF4D6',
    sisaText: '#B45309',
    /** Latar lencana "Habis". */
    habisBg: '#FDEDED',
    habisText: '#D91F26',

    // --- Angka pada lonceng dan tab ---
    badge: '#F23131',

    /** Putih yang ditumpangkan di atas gradasi navy untuk label dan batang grafik. */
    onNavySoft: 'rgba(255, 255, 255, 0.25)',
    /** Putih untuk label kecil di atas gradasi navy ("Penjualan hari ini"). */
    onNavyMuted: 'rgba(255, 255, 255, 0.72)',
    /** Latar pil perbandingan penjualan, putih transparan ±18%. */
    pillBg: 'rgba(255, 255, 255, 0.18)',
  },

  /** Jarak berbasis peran. */
  spacing: {
    /** Jarak kiri-kanan seluruh isi beranda. */
    screenPadding: 16,
    /** Jarak kartu dan bagian satu sama lain. */
    blockGap: 16,
    /** Jarak tanggal ke sapaan. */
    dateGap: 4,
    /** Jarak sapaan ke nama toko di bawahnya. */
    storeGap: 4,
    /** Sisi tombol lonceng bulat. */
    bellSize: 44,
    /** Diameter ikon lonceng di dalam tombol. */
    bellIcon: 20,
    /** Padding di dalam kartu penjualan. */
    salesPadding: 20,
    /** Jarak label ke angka penjualan. */
    salesGap: 4,
    /** Jarak angka ke pil perbandingan. */
    pillGap: 10,
    /** Tinggi pil perbandingan. */
    pillHeight: 26,
    /** Padding kiri-kanan isi pil. */
    pillPadding: 10,
    /** Jarak grafik ke bagian atasnya di dalam kartu penjualan. */
    chartGap: 18,
    /** Lebar satu batang grafik. */
    barWidth: 16,
    /** Jarak antar batang grafik. */
    barGap: 8,
    /** Tinggi maksimum batang grafik. */
    barMaxHeight: 64,
    /** Tinggi batang paling kecil, agar nilai nol tetap terlihat sebagai garis. */
    barMinHeight: 4,
    /** Jarak label hari ke batang di atasnya. */
    dayLabelGap: 6,
    /** Padding di dalam kartu statistik. */
    statPadding: 14,
    /** Tinggi tombol "Mulai transaksi baru". */
    ctaHeight: 64,
    /** Diameter lingkaran putih berisi ikon plus. */
    ctaCircle: 38,
    /** Padding di dalam banner peringatan. */
    bannerPadding: 12,
    /** Jarak ikon ke teks di dalam banner. */
    bannerIconGap: 10,
    /** Padding di dalam kartu daftar (restok dan transaksi terakhir). */
    listPadding: 16,
    /** Tinggi satu baris daftar. */
    rowHeight: 56,
    /** Jarak baris pertama ke garis pemisah di bawahnya. */
    rowGap: 14,
    /** Jarak bawah isi beranda, agar konten terakhir tidak tertutup tab bar. */
    bottomPadding: 32,
  },

  /** Sudut membulat sesuai desain. */
  radius: {
    /** Kartu penjualan — paling membulat di antara semua kartu. */
    sales: 28,
    /** Kartu putih: statistik, restok, transaksi terakhir. */
    card: 16,
    /** Tombol "Mulai transaksi baru". */
    cta: 20,
    /** Banner peringatan kuning. */
    banner: 14,
    /** Lencana stok dan pil perbandingan. */
    pill: 999,
    /** Latar di belakang tab aktif. */
    tabActive: 16,
  },

  /** Ukuran huruf layar beranda. */
  fontSize: {
    /** Label hari di bawah grafik dan meta transaksi. */
    micro: 10,
    /** Label kecil: tanggal, label kartu penjualan, pil, lencana, label tab. */
    caption: 12,
    /** Isi baris, teks banner, tautan "Lihat semua". */
    body: 13,
    /** Nama produk, kode transaksi, nominal transaksi. */
    row: 14,
    /** Teks tombol "Mulai transaksi baru". */
    button: 16,
    /** Judul seksi: "Perlu restok" dan "Transaksi terakhir". */
    section: 20,
    /** Angka pada tiga kartu statistik. */
    stat: 26,
    /** Sapaan "Halo, ...". */
    greeting: 28,
    /** Angka penjualan hari ini. */
    amount: 40,
  },

  /** Ketebalan huruf, sesuai nama yang dipakai Plus Jakarta Sans. */
  fontWeight: {
    semibold: '600',
    bold: '700',
    extraBold: '800',
  } as const,

  /**
   * Nama keluarga Plus Jakarta Sans yang sudah dimuat lewat `expo-font`
   * di `app/_layout.tsx` — layar cukup menyebutnya tanpa memuat ulang.
   */
  fontFamily: {
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },

  /** Gaya bayangan kartu penjualan, agar kartu terangkat dari latar. */
  shadow: {
    shadowColor: '#0D1B3E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },

  /** Ukuran tab bar dan latar pil tab aktif. */
  tab: {
    /** Tinggi seluruh tab bar. */
    height: 80,
    /** Lebar latar pil tab aktif. */
    activeWidth: 54,
    /** Tinggi latar pil tab aktif. */
    activeHeight: 56,
    /** Ukuran ikon Feather. */
    iconSize: 20,
    /** Ukuran angka pada lencana tab dan lonceng. */
    badgeSize: 10,
  },
} as const;

/**
 * Tema tampilan struk digital.
 *
 * Kertas struk memang harus berbeda dari kartu biasa: hurufnya monospace
 * berukuran tetap supaya kolom angka lurus seperti kertas thermal, latarnya
 * putih penuh, dan pemisahnya garis putus-putus.
 *
 * Huruf monospace: keluarga generik `ui-monospace` pada React Native hanya
 * didukung iOS (lihat docs text-style-props), jadi Android memakai nama
 * keluarga bawaannya sendiri. Bila hurufnya gagal dimuat, RN jatuh ke huruf
 * biasa — struk tetap terbaca, hanya kolomnya yang kurang lurus.
 *
 * Seluruh nilai di bawah ini adalah SATU-SATUNYA sumber untuk tampilan struk.
 */
export const receipt = {
  colors: {
    /** Latar layar tempat kertas struk berpijak: abu muda. */
    screen: '#F9FAFB',
    /** Kertas struk. */
    paper: '#FFFFFF',
    /** Teks utama struk: hitam keabuan, seperti tinta thermal. */
    ink: '#111827',
    /** Teks kecil: alamat, telepon, kalimat penutup. */
    inkMuted: '#6B7280',
    /** Garis putus-putus pemisah bagian. */
    rule: '#9CA3AF',
    /** Bayangan di bawah kertas, agar terangkat dari latar. */
    shadow: '#0D1B3E',
    /** Warna tombol struk. */
    button: '#1B3A82',
    /** Latar tombol yang dimatikan. */
    buttonDisabled: '#D1D5DB',
    /** Teks di atas tombol terisi. */
    onButton: '#FFFFFF',
  },

  spacing: {
    /** Jarak kiri-kanan layar tempat kertas berpijak. */
    screenPadding: 16,
    /** Padding di dalam kertas struk. */
    paperPadding: 20,
    /** Jarak antar bagian besar di dalam struk. */
    sectionGap: 16,
    /** Jarak nama barang ke baris "qty x harga" di bawahnya. */
    itemGap: 2,
    /** Jarak kertas ke baris tombol di bawahnya. */
    buttonGap: 20,
    /** Jarak antar tombol. */
    buttonGapBetween: 8,
    /** Jarak ikon ke label di dalam tombol. */
    buttonIconGap: 8,
    /** Jarak bawah layar, supaya tombol terakhir tidak tertutup. */
    bottomPadding: 24,
  },

  size: {
    /** Lebar kertas struk. */
    paperWidth: 300,
    /** Ketebalan garis putus-putus — cukup satu piksel agar terbaca sebagai garis. */
    ruleHeight: 1,
    /** Tinggi tombol. */
    buttonHeight: 48,
    /** Ukuran ikon di dalam tombol. */
    buttonIcon: 18,
  },

  radius: {
    /** Sudut kertas — membulat kecil seperti tepi kertas terpotong. */
    paper: 6,
    /** Sudut tombol. */
    button: 12,
  },

  fontSize: {
    /** Ukuran teks isi struk: baris barang, info transaksi, ringkasan. */
    body: 12,
    /** Nama toko dan label "Segera hadir". */
    title: 14,
    /** Angka TOTAL — paling menonjol. */
    total: 16,
  },

  fontWeight: {
    regular: '400',
    bold: '700',
  } as const,

  /** Huruf monospace bawaan sistem, agar kolom angka lurus. */
  fontFamily: Platform.select({
    ios: 'Courier',
    android: 'monospace',
    default: 'monospace',
  }) as string,

  /** Bayangan lembut di bawah kertas struk. */
  shadow: {
    shadowColor: '#0D1B3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

/**
 * Tema layar Laporan (tab Pemasukan dan Stok).
 *
 * Hampir seluruh warna laporan mengambil dari `navy` dan `colors`: latarnya
 * sama dengan tab lain, kartu ringkasannya memakai gradasi `[navy.main,
 * navy.dark]` yang juga dipakai tombol utama dan chip aktif.
 *
 * Hanya dua aksen di bawah yang tidak ada di palet mana pun — nilai keduanya
 * ditentukan desain (kuning cokelat untuk "menipis", merah pekat untuk
 * "habis") sehingga diberi tempat sendiri, bukan ditulis sebagai hex di layar.
 */
export const report = {
  colors: {
    /** Angka dan teks kartu "stok menipis". */
    warnAccent: '#8A4B00',
    /** Angka dan teks kartu "stok habis". */
    dangerAccent: '#B42318',
  },
  size: {
    /** Sisi bulatan inisial nama produk pada kartu "Perlu restok". */
    initials: 40,
  },
} as const;

/**
 * Tema layar Pembayaran QRIS.
 *
 * Layar ini memakai dua kartu seperti desainnya: kartu navy berisi total
 * yang harus dibayar, dan kartu putih berisi gambar QRIS. Seluruh warna,
 * jarak, radius, dan ukuran huruf di bawah ini adalah satu-satunya sumber
 * layar tersebut — tidak ada angka yang ditulis langsung di `qris.tsx`.
 */
export const qris = {
  colors: {
    /** Latar layar, sama dengan tab lain. */
    background: navy.background,
    /** Kartu putih tempat gambar QR berpijak. */
    surface: '#FFFFFF',
    /** Garis tipis di sekeliling kotak gambar QR. */
    border: navy.border,
    /** Judul layar, angka total di kartu putih, dan kata "QRIS". */
    ink: '#111827',
    /** Label "Total yang harus dibayar" di atas kartu navy. */
    onNavyMuted: 'rgba(255, 255, 255, 0.72)',
    /** Nama merchant di bawah label QRIS. */
    merchant: '#374151',
    /** Latar kotak keterangan di bawah QR. */
    noteBg: '#F3F4F6',
    /** Ikon informasi di dalam kotak keterangan. */
    noteIcon: '#6B7280',
    /** Teks keterangan di dalam kotak keterangan. */
    noteText: '#6B7280',
  },

  spacing: {
    /** Jarak kiri-kanan layar. */
    screen: 20,
    /** Jarak isi layar ke tepi atas. */
    top: 24,
    /** Jarak judul ke kartu total. */
    titleGap: 16,
    /** Jarak kartu total ke kartu QRIS. */
    cardGap: 14,
    /** Jarak antar bagian di dalam kartu QRIS. */
    block: 12,
    /** Jarak rapat: label ke angka, dan hal serupa. */
    tight: 6,
    /** Jarak kartu terakhir ke baris tombol. */
    between: 24,
    /** Jarak antar tombol di bawah. */
    buttonGap: 10,
    /** Jarak bawah layar, supaya tombol terakhir tidak tertutup. */
    bottom: 24,
    /** Padding di dalam kotak keterangan. */
    notePadding: 12,
    /** Jarak ikon ke teks di dalam kotak keterangan. */
    noteIconGap: 8,
    /** Padding di dalam kartu putih. */
    cardPadding: 20,
  },

  radius: {
    /** Sudut kedua kartu. */
    card: 16,
    /** Sudut kotak gambar QR. */
    qr: 12,
    /** Sudut kotak keterangan. */
    note: 12,
  },

  size: {
    /** Sisi kotak yang memuat gambar QRIS. */
    qrCard: 232,
    /** Sisi ikon informasi di dalam kotak keterangan. */
    noteIcon: 18,
  },

  fontSize: {
    /** Judul "Pembayaran QRIS". */
    title: 22,
    /** Label "Total yang harus dibayar". */
    label: 13,
    /** Angka total. */
    amount: 34,
    /** Kata "QRIS". */
    method: 15,
    /** Nama merchant. */
    merchant: 13,
    /** Teks keterangan. */
    note: 13,
  },

  fontWeight: {
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
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
  auth,
  navy,
  home,
  receipt,
  report,
  qris,
} as const;

export type Theme = typeof theme;
