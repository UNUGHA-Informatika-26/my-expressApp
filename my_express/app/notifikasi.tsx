import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { NotificationRow } from '../features/notifications/NotificationRow';
import { useNotifications } from '../features/notifications/queries';
import { getErrorMessage } from '../lib/api';

/**
 * Layar Notifikasi (tugas Fase 8, konsep.md bagian 3).
 *
 * Menampilkan peringatan stok menipis/habis dan hutang jatuh tempo,
 * paling mendesak di urutan paling atas. Ketuk satu baris untuk membuka
 * produk atau hutang yang dimaksud.
 */
export default function NotifikasiScreen() {
  const notificationsQuery = useNotifications();

  if (notificationsQuery.isError) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Notifikasi' }} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{getErrorMessage(notificationsQuery.error)}</Text>
          <Button label="Coba lagi" onPress={() => notificationsQuery.refetch()} />
        </View>
      </View>
    );
  }

  if (notificationsQuery.isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Notifikasi' }} />
        <View style={styles.center}>
          <Text style={styles.muted}>Memuat notifikasi...</Text>
        </View>
      </View>
    );
  }

  const items = notificationsQuery.data?.items ?? [];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Notifikasi' }} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationRow item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#059669" />
            <Text style={styles.emptyTitle}>Tidak ada peringatan</Text>
            <Text style={styles.emptyText}>Stok aman dan tidak ada hutang mendesak.</Text>
          </View>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <Text style={styles.footer}>
              Sakelar notifikasi ponsel dan unduh laporan ada di halaman Akun.
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  list: { padding: 16, paddingBottom: 32 },
  muted: { fontSize: 15, color: '#6B7280' },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  empty: { alignItems: 'center', gap: 8, paddingTop: 64 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  footer: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
});
