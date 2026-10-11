import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth';

/**
 * Layar pembuka. Jika sudah login langsung ke tab Beranda,
 * jika belum ke layar Login.
 */
export default function Index() {
  const token = useAuthStore((state) => state.token);
  return <Redirect href={token ? '/(tabs)' : '/login'} />;
}
