import { BarChart } from 'react-native-gifted-charts';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { formatWeekday } from '../../lib/date';
import { formatRupiah } from '../../lib/format';
import type { ChartPoint } from '../../types/api';

interface Props {
  data: ChartPoint[];
}

/**
 * Grafik batang penjualan 7 hari terakhir (library sesuai docs/teknologi.md).
 * Sumbu-X memakai singkatan hari berbahasa Indonesia.
 *
 * Sumbu-Y sengaja tanpa teks angka: nilai Rupiah bisa sangat panjang dan
 * akan memakan tempat. Angka pastinya tertera pada judul di atas grafik.
 */
export function SalesChart({ data }: { data: ChartPoint[] }) {
  const total = data.reduce((sum, point) => sum + point.total, 0);
  const peak = Math.max(...data.map((point) => point.total), 0);

  const chartData = data.map((point) => ({
    value: point.total,
    label: formatWeekday(point.date),
    frontColor: point.total === peak && peak > 0 ? '#2563EB' : '#93C5FD',
  }));

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Penjualan 7 hari</Text>
        <Text style={styles.total}>{formatRupiah(total)}</Text>
      </View>

      <View style={styles.chartBox}>
        <BarChart
          data={chartData}
          height={150}
          noOfSections={3}
          barWidth={18}
          spacing={12}
          initialSpacing={4}
          endSpacing={4}
          hideRules
          hideYAxisText
          xAxisColor="#E5E7EB"
          xAxisTextNumberOfLines={1}
          xAxisLabelTextStyle={styles.axis}
          isAnimated
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  total: { fontSize: 16, fontWeight: '800', color: '#2563EB' },
  chartBox: { marginTop: 14 },
  axis: { fontSize: 10, color: '#6B7280' },
});
