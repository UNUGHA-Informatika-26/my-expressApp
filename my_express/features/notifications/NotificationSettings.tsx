import { Ionicons } from '@expo/vector-icons';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import {
  LOCAL_NOTIFICATIONS_AVAILABLE,
  LOCAL_NOTIFICATIONS_UNAVAILABLE_NOTE,
  ensureNotificationPermission,
} from './localNotifications';
import { text } from '../../lib/theme';
import { useSettingsStore, type NotificationToggleKey } from '../../store/settings';

/** Satu baris sakelar pada pengaturan notifikasi. */
interface ToggleRow {
  key: NotificationToggleKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const ROWS: ToggleRow[] = [
  {
    key: 'stokMenipis',
    icon: 'warning-outline',
    title: 'Stok menipis',
    description: 'Barang yang stoknya di bawah batas minimum atau sudah habis.',
  },
  {
    key: 'hutangJatuhTempo',
    icon: 'time-outline',
    title: 'Jatuh tempo hutang',
    description: 'Hutang lewat tempo atau jatuh tempo dalam 7 hari.',
  },
  {
    key: 'ringkasanPenjualan',
    icon: 'bar-chart-outline',
    title: 'Ringkasan penjualan',
    description: 'Total penjualan hari ini, dikirim tiap malam jam 21.00.',
  },
];

/**
 * Pengaturan notifikasi di halaman Akun (konsep.md bagian 11).
 *
 * Preferensi disimpan di Zustand `persist` — bukan di server
 * (04-api.md baris 94: preferensi ditangani di aplikasi).
 *
 * Izin diminta saat pengguna menyalakan sakelar, bukan saat aplikasi dibuka,
 * supaya prompt sistem tidak muncul sebelum ada yang memintanya.
 */
export function NotificationSettings() {
  const stokMenipis = useSettingsStore((state) => state.stokMenipis);
  const hutangJatuhTempo = useSettingsStore((state) => state.hutangJatuhTempo);
  const ringkasanPenjualan = useSettingsStore((state) => state.ringkasanPenjualan);
  const setToggle = useSettingsStore((state) => state.setToggle);

  const values: Record<NotificationToggleKey, boolean> = {
    stokMenipis,
    hutangJatuhTempo,
    ringkasanPenjualan,
  };

  const onToggle = async (key: NotificationToggleKey, value: boolean) => {
    if (value) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Izin notifikasi diperlukan',
          'my_express belum diizinkan mengirim notifikasi. Nyalakan lewat pengaturan ponsel Anda.',
        );
        return;
      }
    }
    setToggle(key, value);
  };

  return (
    <Card>
      <Text style={text.cardTitle}>Notifikasi</Text>
      <Text style={styles.hint}>
        Sakelar ini mengatur notifikasi yang muncul di ponsel. Layar Notifikasi tetap menampilkan
        semua peringatan.
      </Text>

      {!LOCAL_NOTIFICATIONS_AVAILABLE && (
        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={18} color="#B45309" />
          <Text style={styles.noticeText}>{LOCAL_NOTIFICATIONS_UNAVAILABLE_NOTE}</Text>
        </View>
      )}

      {ROWS.map((row) => (
        <View key={row.key} style={styles.row}>
          <View style={styles.iconBox}>
            <Ionicons name={row.icon} size={18} color="#2563EB" />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.rowDescription}>{row.description}</Text>
          </View>
          <Switch
            value={values[row.key]}
            onValueChange={(value) => void onToggle(row.key, value)}
            disabled={!LOCAL_NOTIFICATIONS_AVAILABLE}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={values[row.key] ? '#2563EB' : '#F3F4F6'}
            accessibilityLabel={row.title}
          />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, color: '#6B7280', marginTop: 6, marginBottom: 4, lineHeight: 18 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  noticeText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowDescription: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
});
