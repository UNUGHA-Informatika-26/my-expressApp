import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import type { NotificationItem } from '../../types/api';

/**
 * Notifikasi lokal my_express (expo-notifications).
 *
 * Semua notifikasi di sini bersifat **lokal**, tidak ada push server:
 * peringatan diturunkan dari data toko yang sudah dimuat aplikasi.
 *
 * Catatan penting (SDK 57): `expo-notifications` tidak bisa dipakai di
 * Android yang berjalan di Expo Go. Efek samping modulnya
 * (`DevicePushTokenAutoRegistration.fx.js`) memanggil `addPushTokenListener`
 * begitu modul dimuat, dan fungsi itu langsung melempar error pada Android +
 * Expo Go (lihat `warnOfExpoGoPushUsage.js`). Akibatnya sekadar
 * `import 'expo-notifications'` sudah cukup untuk menjatuhkan aplikasi,
 * tanpa perlu memanggil API apa pun — meski dokumentasi menyebut local
 * notifications "tetap tersedia di Expo Go".
 *
 * Karena itu modul dimuat **malas** lewat `await import()` dan hanya setelah
 * lingkungan dipastikan aman. Di Expo Go Android seluruh fungsi di berkas ini
 * menjadi no-op, dan layar Akun menjelaskan alasannya.
 */

/** Kanal Android 13+ wajib dibuat sebelum prompt izin bisa muncul. */
const CHANNEL_ID = 'my-express-alerts';

/** Identitas tetap untuk jadwal ringkasan penjualan, agar bisa ditimpa. */
const SALES_SUMMARY_ID = 'ringkasan-penjualan';

/** Jam ringkasan penjualan (21:00 WIB). */
const SALES_SUMMARY_HOUR = 21;

/** Batas notifikasi yang ditembakkan sekaligus, supaya tidak membanjiri bar. */
const MAX_ALERTS_PER_SYNC = 5;

/**
 * Izin pernah ditolak selama sesi berjalan. Tanpa penanda ini, setiap sinkron
 * akan memanggil `requestPermissionsAsync` lagi dan mengganggu pengguna.
 * Dipulihkan saat aplikasi dibuka ulang sehingga pengguna masih bisa berubah
 * pikiran lewat pengaturan sistem.
 */
let permissionDeclined = false;

/**
 * Bisa atau tidaknya notifikasi lokal dipakai pada lingkungan yang sedang
 * berjalan. false hanya untuk Android + Expo Go; selain itu (APK hasil build,
 * development build, iOS) selalu true.
 */
export const LOCAL_NOTIFICATIONS_AVAILABLE = !(
  Platform.OS === 'android' && isRunningInExpoGo()
);

/** Penjelasan untuk pengguna saat notifikasi ponsel tidak tersedia. */
export const LOCAL_NOTIFICATIONS_UNAVAILABLE_NOTE =
  'Sakelar di bawah ini dinonaktifkan karena aplikasi sedang dijalankan lewat Expo Go. ' +
  'Notifikasi ponsel baru bekerja setelah my_express dipasang sebagai aplikasi (APK). ' +
  'Layar Notifikasi tetap menampilkan semua peringatan.';

/** Tipe modul expo-notifications, diambil sebagai tipe saja (hapus saat compile). */
type NotificationsModule = typeof import('expo-notifications');

/** Hasil pemuatan malas, disimpan supaya handler hanya dipasang sekali. */
let loadedModule: NotificationsModule | null = null;

/**
 * Muat `expo-notifications` secara malas.
 *
 * Mengembalikan null bila lingkungan tidak mendukung, sehingga pemanggil wajib
 * menangani null — bukan mengasumsikan modul selalu ada.
 */
async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!LOCAL_NOTIFICATIONS_AVAILABLE) {
    return null;
  }
  if (loadedModule !== null) {
    return loadedModule;
  }

  const notifications = await import('expo-notifications');

  // Tampilkan notifikasi saat aplikasi sedang berjalan. Tanpa handler ini,
  // notifikasi lokal hanya muncul saat aplikasi di latar.
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  loadedModule = notifications;
  return notifications;
}

/**
 * Buat kanal notifikasi Android. Dipanggil sebelum meminta izin karena
 * Android 13 tidak menampilkan prompt izin sebelum ada kanal.
 */
async function ensureChannel(notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    await notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Peringatan my_express',
      importance: notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 100, 200],
    });
  } catch (error) {
    // Gagal membuat kanal bukan alasan untuk menghentikan seluruh fitur;
    // notifikasi tetap bisa tampil di kanal bawaan sistem.
    console.warn('Membuat kanal notifikasi gagal:', error);
  }
}

/**
 * Minta izin notifikasi. true berarti boleh menampilkan notifikasi.
 * Mengembalikan false bila notifikasi tidak tersedia di lingkungan ini.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const notifications = await loadNotifications();
  if (notifications === null) {
    return false;
  }

  await ensureChannel(notifications);

  const current = await notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  if (permissionDeclined) {
    return false;
  }

  const requested = await notifications.requestPermissionsAsync();
  if (!requested.granted) {
    permissionDeclined = true;
  }
  return requested.granted;
}

/** Sakelar yang mengatur satu peringatan. */
type AlertToggle = 'stokMenipis' | 'hutangJatuhTempo';

/** Petakan jenis peringatan ke sakelarnya. */
function toggleFor(item: NotificationItem): AlertToggle {
  return item.type === 'hutang_jatuh_tempo' ? 'hutangJatuhTempo' : 'stokMenipis';
}

/**
 * Tampilkan notifikasi untuk peringatan yang belum pernah dibacakan.
 *
 * Hanya item yang sakelarnya menyala yang diproses, dan hanya yang belum ada
 * di `notifiedIds` — sehingga peringatan yang sama tidak berulang tiap kali
 * data dimuat ulang. Mengembalikan id yang berhasil dibacakan; bila izin
 * ditolak, daftar kosong sehingga `notifiedIds` tidak ditandai dan notifikasi
 * tetap bisa muncul setelah pengguna memberi izin.
 */
export async function syncAlertNotifications(
  items: NotificationItem[],
  toggles: { stokMenipis: boolean; hutangJatuhTempo: boolean },
  notifiedIds: string[],
): Promise<string[]> {
  const notifications = await loadNotifications();
  if (notifications === null) {
    // Tidak ditandai sebagai sudah dibacakan, supaya peringatan tetap muncul
    // nanti saat aplikasi berjalan sebagai APK.
    return [];
  }

  const pending = items.filter(
    (item) => !notifiedIds.includes(item.id) && toggles[toggleFor(item)],
  );
  if (pending.length === 0) {
    return [];
  }

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return [];
  }

  const shown: string[] = [];
  for (const item of pending.slice(0, MAX_ALERTS_PER_SYNC)) {
    try {
      await notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.message, data: { id: item.id } },
        trigger: { channelId: CHANNEL_ID },
      });
      shown.push(item.id);
    } catch (error) {
      console.warn('Menampilkan notifikasi gagal:', error);
    }
  }
  return shown;
}

/**
 * Pasang atau lepas jadwal ringkasan penjualan tiap hari jam 21:00.
 *
 * Isinya diisi ulang setiap kali data beranda dimuat, sehingga angka yang
 * tampil adalah penjualan terakhir yang diketahui aplikasi. Jadwal memakai
 * identitas tetap, jadi memanggil fungsi ini berulang menimpa jadwal lama
 * tanpa menumpuk.
 */
export async function setSalesSummarySchedule(
  enabled: boolean,
  body: string | null,
): Promise<void> {
  const notifications = await loadNotifications();
  if (notifications === null) {
    return;
  }

  try {
    await notifications.cancelScheduledNotificationAsync(SALES_SUMMARY_ID);
  } catch (error) {
    console.warn('Membatalkan jadwal lama gagal:', error);
  }

  if (!enabled || body === null) {
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return;
  }

  try {
    await notifications.scheduleNotificationAsync({
      identifier: SALES_SUMMARY_ID,
      content: { title: 'Ringkasan penjualan hari ini', body },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DAILY,
        hour: SALES_SUMMARY_HOUR,
        minute: 0,
        channelId: CHANNEL_ID,
      },
    });
  } catch (error) {
    console.warn('Menjadwalkan ringkasan penjualan gagal:', error);
  }
}
