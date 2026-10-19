import { StyleSheet, Text, View } from 'react-native';
import { formatDateTime } from '../lib/date';
import { formatRibuan, formatRupiah } from '../lib/format';
import type { ReceiptPaymentMethod } from '../lib/receiptText';
import { receipt } from '../lib/theme';

/**
 * Satu baris barang pada struk. Bentuknya sengaja dibuat sendiri — bukan
 * tipe item dari API — supaya komponen ini tetap bisa dipakai ulang oleh
 * printer thermal nanti tanpa mengenal bentuk data jaringan.
 */
export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface ReceiptProps {
  storeName?: string | null;
  storeAddress?: string | null;
  phone?: string | null;
  invoiceNo: string;
  /** Timestamp ISO 8601 dari server. */
  createdAt: string;
  cashierName?: string | null;
  items: ReceiptItem[];
  total: number;
  paymentMethod: ReceiptPaymentMethod;
  /** Uang diterima; hanya terisi untuk pembayaran tunai. */
  amountPaid?: number | null;
  /** Kembalian; hanya terisi untuk pembayaran tunai. */
  change?: number | null;
}

/** Garis pemisah putus-putus, dibuat dari View — bukan deretan tanda hubung. */
function DashedRule() {
  return <View style={styles.rule} />;
}

/** Baris "label di kiri, nilai di kanan". */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowText}>{label}</Text>
      <Text style={styles.rowText}>{value}</Text>
    </View>
  );
}

/**
 * Tampilan struk digital — meniru kertas thermal minimarket.
 *
 * Komponen ini HANYA menerima data lewat props dan tidak memanggil API
 * apa pun, sehingga bisa dipasang di layar mana pun (pembayaran berhasil,
 * riwayat) dan kelak dipakai ulang untuk cetak thermal.
 *
 * Seluruh teks memakai huruf monospace supaya kolom angka lurus. Nama
 * barang panjang turun baris sendiri, tidak terpotong.
 */
export function Receipt({
  storeName,
  storeAddress,
  phone,
  invoiceNo,
  createdAt,
  cashierName,
  items,
  total,
  paymentMethod,
  amountPaid,
  change,
}: ReceiptProps) {
  // "Total item" adalah jumlah barang, bukan jumlah baris —
  // 3 pulpen dalam satu baris dihitung 3.
  const totalItem = items.reduce((sum, item) => sum + item.qty, 0);
  // Pembayaran tunai membawa uang yang diterima; QRIS dan transfer tidak.
  const paid = amountPaid ?? total;

  return (
    <View style={styles.paper}>
      {/* 1. Kepala toko */}
      {storeName ? (
        <Text style={styles.storeName}>{storeName}</Text>
      ) : null}
      {storeAddress ? <Text style={styles.muted}>{storeAddress}</Text> : null}
      {phone ? <Text style={styles.muted}>{phone}</Text> : null}
      <DashedRule />

      {/* 2. Info transaksi */}
      <Row label="No. Transaksi" value={invoiceNo} />
      <Row label="Tanggal" value={formatDateTime(createdAt)} />
      {cashierName ? <Row label="Kasir" value={cashierName} /> : null}
      <DashedRule />

      {/* 3. Daftar barang: nama dulu, lalu "qty x harga" dan subtotalnya */}
      {items.map((item, index) => (
        // Kunci memakai nama dan urutan karena barang sama bisa muncul
        // lebih dari satu baris dan tidak memiliki id sendiri.
        <View key={`${item.name}-${index}`} style={styles.item}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.row}>
            <Text style={styles.rowText}>{`${item.qty} x ${formatRibuan(item.price)}`}</Text>
            <Text style={styles.rowText}>{formatRibuan(item.subtotal)}</Text>
          </View>
        </View>
      ))}
      <DashedRule />

      {/* 4. Ringkasan. Kembalian hanya ada pada pembayaran tunai. */}
      <Row label="Total item" value={String(totalItem)} />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
      </View>
      <Row label={paymentMethod} value={formatRupiah(paid)} />
      {change != null ? <Row label="Kembalian" value={formatRupiah(change)} /> : null}
      <DashedRule />

      {/* 5. Penutup */}
      <Text style={styles.closing}>Terima kasih telah berbelanja</Text>
      <Text style={styles.closingMuted}>Barang yang sudah dibeli tidak dapat ditukar</Text>
    </View>
  );
}

/**
 * Huruf monospace diterapkan pada SEMUA teks struk, bukan hanya angka —
 * kolom baru benar-benar lurus kalau seluruh baris memakai lebar huruf yang sama.
 */
const mono = {
  fontFamily: receipt.fontFamily,
  fontSize: receipt.fontSize.body,
  color: receipt.colors.ink,
} as const;

const styles = StyleSheet.create({
  /** Kertas putih di tengah layar, dengan bayangan lembut. */
  paper: {
    width: receipt.size.paperWidth,
    alignSelf: 'center',
    backgroundColor: receipt.colors.paper,
    borderRadius: receipt.radius.paper,
    padding: receipt.spacing.paperPadding,
    ...receipt.shadow,
  },
  storeName: {
    ...mono,
    fontSize: receipt.fontSize.title,
    fontWeight: receipt.fontWeight.bold,
    textAlign: 'center',
    marginBottom: receipt.spacing.itemGap,
  },
  muted: {
    ...mono,
    color: receipt.colors.inkMuted,
    textAlign: 'center',
  },
  closing: {
    ...mono,
    textAlign: 'center',
  },
  closingMuted: {
    ...mono,
    color: receipt.colors.inkMuted,
    textAlign: 'center',
  },
  /**
   * Garis putus-putus: View setinggi satu piksel dengan satu sisi bergaris.
   * RN tidak memotong sudut induk, jadi garis ini berhenti di padding kertas.
   */
  rule: {
    height: receipt.size.ruleHeight,
    borderTopWidth: receipt.size.ruleHeight,
    borderStyle: 'dashed',
    borderColor: receipt.colors.rule,
    marginVertical: receipt.spacing.sectionGap,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: receipt.spacing.itemGap,
  },
  /** `flexShrink` membuat label panjang turun baris, bukan mendorong nilai keluar. */
  rowText: {
    ...mono,
    flexShrink: 1,
  },
  item: {
    marginBottom: receipt.spacing.itemGap,
  },
  itemName: {
    ...mono,
    marginBottom: receipt.spacing.itemGap,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: receipt.spacing.itemGap,
    marginVertical: receipt.spacing.itemGap,
  },
  totalLabel: {
    ...mono,
    fontSize: receipt.fontSize.total,
    fontWeight: receipt.fontWeight.bold,
  },
  totalValue: {
    ...mono,
    fontSize: receipt.fontSize.total,
    fontWeight: receipt.fontWeight.bold,
    flexShrink: 1,
    textAlign: 'right',
  },
});
