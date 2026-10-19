import { StyleSheet, Text, View } from 'react-native';
import { home } from '../../lib/theme';
import type { StockStatus } from '../../types/api';

/**
 * Label status stok.
 * Disimpan di sini (bukan di dalam komponen) supaya laporan dan lencana
 * memakai ejaan yang sama; laporan menulis statusnya sebagai teks, bukan lencana.
 */
export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  aman: 'Aman',
  menipis: 'Menipis',
  habis: 'Habis',
};

const COLOR: Record<StockStatus, { bg: string; text: string }> = {
  aman: { bg: '#DCFCE7', text: '#166534' },
  menipis: { bg: '#FEF3C7', text: '#92400E' },
  habis: { bg: '#FEE2E2', text: '#991B1B' },
};

interface Props {
  status: StockStatus;
  /**
   * Jumlah sisa stok. Bila diisi, lencana memakai gaya Beranda — "Sisa 8"
   * oranye atau "Habis" merah — bukan lencana tiga warna seperti di Katalog.
   * Karena itu prop ini bersifat opsional: layar lain yang tidak mengisinya
   * tetap tampil persis seperti sebelumnya.
   */
  sisa?: number;
}

/** Lencana status stok: hijau (aman), kuning (menipis), merah (habis). */
export function StockBadge({ status, sisa }: Props) {
  // Gaya Beranda: angka sisa ikut ditampilkan, dengan palet navy.
  if (sisa !== undefined) {
    const habis = status === 'habis';
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: habis ? home.colors.habisBg : home.colors.sisaBg },
        ]}
      >
        <Text
          style={[
            styles.text,
            styles.home,
            { color: habis ? home.colors.habisText : home.colors.sisaText },
          ]}
        >
          {habis ? STOCK_STATUS_LABEL.habis : `Sisa ${sisa}`}
        </Text>
      </View>
    );
  }

  const color = COLOR[status];
  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>{STOCK_STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '700' },
  home: { fontFamily: home.fontFamily.bold, fontSize: home.fontSize.caption },
});
