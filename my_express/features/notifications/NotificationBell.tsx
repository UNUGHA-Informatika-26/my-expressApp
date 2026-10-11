import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNotifications } from './queries';

/**
 * Ikon lonceng di header Beranda dengan angka peringatan (konsep.md bagian 3).
 *
 * Angkanya berasal dari `count` server, sehingga selalu sama dengan jumlah
 * baris di layar Notifikasi.
 */
export function NotificationBell() {
  const notificationsQuery = useNotifications();
  const count = notificationsQuery.data?.count ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `Notifikasi, ${count} peringatan` : 'Notifikasi'}
      hitSlop={8}
      onPress={() => router.push('/notifikasi')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons
        name={count > 0 ? 'notifications' : 'notifications-outline'}
        size={22}
        color="#111827"
      />

      {count > 0 && (
        <View style={styles.badge}>
          {/* Angka lebar, mis. 100+, agar badge tidak meluap ke luar ikon. */}
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 4 },
  pressed: { opacity: 0.6 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
});
