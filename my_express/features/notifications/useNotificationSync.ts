import { useEffect } from 'react';
import { formatRupiah } from '../../lib/format';
import { useSettingsStore } from '../../store/settings';
import { useDashboard } from '../dashboard/queries';
import {
  LOCAL_NOTIFICATIONS_AVAILABLE,
  setSalesSummarySchedule,
  syncAlertNotifications,
} from './localNotifications';
import { useNotifications } from './queries';

/**
 * Sambungkan data toko ke notifikasi lokal.
 *
 * Dipanggil satu kali dari layout tab (hanya setelah pengguna login), dan
 * memakai query yang sama dengan layar Beranda sehingga tidak ada permintaan
 * jaringan ganda.
 *
 * Dua pekerjaan:
 * 1. Tembakkan notifikasi lokal untuk peringatan baru sesuai sakelar pengguna,
 *    lalu tandai sudah dibacakan agar tidak berulang.
 * 2. Jaga jadwal ringkasan penjualan tiap malam agar isinya tetap terbaru.
 *
 * Server state tidak disimpan di Zustand; store hanya menyimpan preferensi
 * dan penanda "sudah diberitahu" (AGENTS.md).
 */
export function useNotificationSync(): void {
  const notificationsQuery = useNotifications();
  const dashboardQuery = useDashboard();

  const stokMenipis = useSettingsStore((state) => state.stokMenipis);
  const hutangJatuhTempo = useSettingsStore((state) => state.hutangJatuhTempo);
  const ringkasanPenjualan = useSettingsStore((state) => state.ringkasanPenjualan);
  const notifiedIds = useSettingsStore((state) => state.notifiedIds);
  const markNotified = useSettingsStore((state) => state.markNotified);

  const items = notificationsQuery.data?.items;
  const todaySales = dashboardQuery.data?.todaySales;

  // Peringatan stok dan hutang.
  useEffect(() => {
    // Di lingkungan tanpa dukungan notifikasi (Expo Go + Android) kita tidak
    // menandai apa pun sebagai sudah dibacakan, sehingga peringatan tetap
    // muncul nanti saat aplikasi berjalan sebagai APK.
    if (!LOCAL_NOTIFICATIONS_AVAILABLE || !items) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const shown = await syncAlertNotifications(
        items,
        { stokMenipis, hutangJatuhTempo },
        notifiedIds,
      );
      if (shown.length > 0 && !cancelled) {
        markNotified(shown);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items, stokMenipis, hutangJatuhTempo, notifiedIds, markNotified]);

  // Jadwal ringkasan penjualan. Saat sakelar mati, jadwal lama dibatalkan;
  // saat menyala, isinya diisi ulang dengan penjualan terakhir yang diketahui.
  useEffect(() => {
    if (!LOCAL_NOTIFICATIONS_AVAILABLE) {
      return;
    }
    if (!ringkasanPenjualan) {
      void setSalesSummarySchedule(false, null);
      return;
    }
    if (todaySales === undefined) {
      return;
    }
    void setSalesSummarySchedule(
      true,
      `Total penjualan hari ini ${formatRupiah(todaySales)}. Buka my_express untuk detail.`,
    );
  }, [ringkasanPenjualan, todaySales]);
}
