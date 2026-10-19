import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDashboard } from '../dashboard/queries';
import { countCart, useCartStore } from '../../store/cart';
import { home, navy, spacing } from '../../lib/theme';

/** Ikon Feather tiap tab, sesuai nama rute pada navigator. */
const ICON: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'home',
  katalog: 'grid',
  kasir: 'shopping-cart',
  laporan: 'bar-chart-2',
  hutang: 'file-text',
  akun: 'user',
};

/**
 * Tab bar beranda.
 *
 * Tab bar bawaan hanya bisa mengganti WARNA ikon dan teks tab aktif, sedangkan
 * desain meminta latar pil membulat di belakang tab aktif. Karena itu tab bar
 * ini ditulis sendiri lewat prop `tabBar` pada `<Tabs>`; seluruh warna, ukuran,
 * dan jarak diambil dari token `home`.
 *
 * Lencana tab Hutang berisi gabungan hutang lewat tempo dan jatuh tempo 7 hari
 * — angka yang sama dengan banner peringatan di beranda. Lencana tab Kasir
 * berisi jumlah item keranjang dan disembunyikan bila nol.
 */
export function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const dashboardQuery = useDashboard();
  const cartItems = useCartStore((s) => s.items);

  const dueDebts = dashboardQuery.data?.dueDebts;
  const badgeByRoute: Record<string, number> = {
    hutang: dueDebts ? dueDebts.overdueCount + dueDebts.dueIn7DaysCount : 0,
    kasir: countCart(cartItems),
  };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const badge = badgeByRoute[route.name] ?? 0;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        const descriptor = descriptors[route.key];
        const label = descriptor.options.title ?? route.name;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={badge > 0 ? `${label}, ${badge} peringatan` : label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.slot}
          >
            <View style={[styles.pill, isFocused && styles.pillActive]}>
              <Feather
                name={ICON[route.name] ?? 'circle'}
                size={home.tab.iconSize}
                color={isFocused ? navy.main : navy.textSecondary}
              />
              <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>

              {badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: home.colors.surface,
    borderTopWidth: 1,
    borderTopColor: navy.border,
    paddingTop: spacing.sm,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    width: home.tab.activeWidth,
    height: home.tab.activeHeight,
    borderRadius: home.radius.tabActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: navy.tabActive },
  label: {
    marginTop: spacing.hair,
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.caption,
    color: navy.textSecondary,
  },
  labelActive: { color: navy.main },
  badge: {
    position: 'absolute',
    top: 2,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: home.colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: home.fontFamily.bold,
    fontSize: home.tab.badgeSize,
    color: home.colors.surface,
  },
});
