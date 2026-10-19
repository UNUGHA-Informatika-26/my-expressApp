import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNotifications } from './queries';
import { home, navy } from '../../lib/theme';

interface Props {
  /**
   * Angka pada badge. Bila tidak diisi, memakai `count` dari server, yang
   * sudah mewakili seluruh peringatan stok dan hutang. Beranda mengisi prop
   * ini agar angkanya persis rumus yang dipakai di layar tersebut.
   */
  count?: number;
}

/**
 * Tombol lonceng bulat putih di kepala beranda (konsep.md bagian 3).
 *
 * Tanpa `count`, angkanya berasal dari `count` server sehingga selalu sama
 * dengan jumlah baris di layar Notifikasi.
 */
export function NotificationBell({ count }: Props) {
  const notificationsQuery = useNotifications();
  const total = count ?? notificationsQuery.data?.count ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={total > 0 ? `Notifikasi, ${total} peringatan` : 'Notifikasi'}
      hitSlop={8}
      onPress={() => router.push('/notifikasi')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Feather name="bell" size={home.tab.iconSize} color={navy.dark} />

      {total > 0 && (
        <View style={styles.badge}>
          {/* Angka lebar, mis. 100+, agar badge tidak meluap ke luar tombol. */}
          <Text style={styles.badgeText}>{total > 99 ? '99+' : total}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: home.spacing.bellSize,
    height: home.spacing.bellSize,
    borderRadius: home.spacing.bellSize / 2,
    backgroundColor: home.colors.surface,
    borderWidth: 1,
    borderColor: navy.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: home.colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: home.colors.surface,
  },
  badgeText: {
    fontFamily: home.fontFamily.bold,
    fontSize: home.tab.badgeSize,
    color: home.colors.surface,
  },
});
