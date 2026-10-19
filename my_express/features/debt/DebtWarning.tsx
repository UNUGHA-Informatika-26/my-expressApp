import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { home } from '../../lib/theme';
import type { DueDebts } from '../../types/api';

/**
 * Peringatan hutang di beranda (tugas Fase 7).
 *
 * Angkanya gabungan hutang yang sudah lewat tempo dan yang jatuh tempo dalam
 * 7 hari ke depan, sehingga hutang paling mendesak tetap tidak hilang dari
 * perhatian pemilik toko. Tampil hanya bila jumlahnya lebih dari nol;
 * selain itu mengembalikan null agar beranda tidak menampilkan kartu kosong.
 */
export function DebtWarning({ dueDebts }: { dueDebts: DueDebts }) {
  const total = dueDebts.overdueCount + dueDebts.dueIn7DaysCount;

  if (total === 0) {
    return null;
  }

  return (
    <Card
      onPress={() => router.push('/(tabs)/hutang')}
      accessibilityLabel={`${total} hutang distributor segera jatuh tempo. Buka tab Hutang.`}
      spaced={false}
      style={styles.banner}
    >
      <View style={styles.row}>
        <Feather name="alert-triangle" size={18} color={home.colors.bannerText} />
        <Text style={styles.text}>
          {total} hutang distributor segera jatuh tempo
        </Text>
        <Feather name="chevron-right" size={18} color={home.colors.bannerText} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: home.colors.bannerBg,
    borderColor: home.colors.bannerBorder,
    borderRadius: home.radius.banner,
    padding: home.spacing.bannerPadding,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: home.spacing.bannerIconGap,
  },
  text: {
    flex: 1,
    fontFamily: home.fontFamily.semibold,
    fontSize: home.fontSize.body,
    color: home.colors.bannerText,
  },
});
