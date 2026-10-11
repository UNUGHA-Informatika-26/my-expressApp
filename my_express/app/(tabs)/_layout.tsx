import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { NotificationBell } from '../../features/notifications/NotificationBell';
import { useNotificationSync } from '../../features/notifications/useNotificationSync';

/**
 * Navigasi tab utama: Beranda, Katalog, Kasir, Riwayat, Hutang, Akun.
 * Tab Hutang ditambahkan pada Fase 7 sesuai keputusan di docs/PROGRESS.md.
 *
 * Layout ini hanya dirender setelah pengguna login, jadi tempat yang tepat
 * untuk menjalankan sinkronisasi notifikasi (Fase 8) tanpa memanggil API
 * dari layar login.
 */
export default function TabsLayout() {
  useNotificationSync();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        // Ikon lonceng berangka tersedia di semua tab (konsep.md bagian 3).
        headerRight: () => <NotificationBell />,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="katalog"
        options={{
          title: 'Katalog',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="kasir"
        options={{
          title: 'Kasir',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="riwayat"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="hutang"
        options={{
          title: 'Hutang',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="akun"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
