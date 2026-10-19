/**
 * Pembentuk teks struk untuk tombol Bagikan, dan untuk printer thermal nanti.
 *
 * Seluruh fungsi di sini murni: tidak menyentuh jaringan, store, maupun
 * komponen. Karena itu berkas ini bisa dipakai ulang oleh dua layar berbeda
 * (pembayaran berhasil dan riwayat) tanpa mengulang logika penataan kolom.
 */

import type { PaymentMethod, Transaction } from '../types/api';
import { formatDateTime } from './date';
import { formatRibuan, formatRupiah } from './format';

/** Lebar bawaan kertas struk thermal, dalam karakter. */
export const RECEIPT_WIDTH = 32;

/** Metode bayar seperti tertulis pada struk. */
export type ReceiptPaymentMethod = 'Tunai' | 'QRIS' | 'Transfer';

/**
 * Label metode bayar untuk struk.
 * Sumbernya satu, dipakai semua layar struk supaya ejaannya tidak berbeda-beda.
 */
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, ReceiptPaymentMethod> = {
  tunai: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
};

/**
 * Kepala struk. Semua isinya opsional: tabel pengguna tidak memiliki kolom
 * alamat toko, dan nama toko boleh saja belum diisi pemiliknya.
 */
export interface ReceiptHeader {
  storeName?: string | null;
  storeAddress?: string | null;
  phone?: string | null;
  cashierName?: string | null;
}

/**
 * Pecah teks menjadi baris-baris selebar `width`.
 * Kata yang lebih panjang dari lebar kertas dipecah per karakter, supaya
 * nama barang panjang tetap terbaca penuh dan tidak terpotong.
 */
function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';

  for (const rawWord of text.split(/\s+/)) {
    if (rawWord === '') {
      continue;
    }

    let rest = rawWord;
    while (rest.length > width) {
      if (line !== '') {
        lines.push(line);
        line = '';
      }
      lines.push(rest.slice(0, width));
      rest = rest.slice(width);
    }

    if (line === '') {
      line = rest;
    } else if (line.length + 1 + rest.length <= width) {
      line = `${line} ${rest}`;
    } else {
      lines.push(line);
      line = rest;
    }
  }

  if (line !== '') {
    lines.push(line);
  }

  return lines;
}

/** Ratakan teks ke tengah selebar kertas. */
function center(text: string, width: number): string {
  if (text.length >= width) {
    return text;
  }
  const pad = width - text.length;
  const left = Math.floor(pad / 2);
  return `${' '.repeat(left)}${text}${' '.repeat(pad - left)}`;
}

/** Ratakan teks ke kanan selebar kertas. */
function right(text: string, width: number): string {
  if (text.length >= width) {
    return text;
  }
  return `${' '.repeat(width - text.length)}${text}`;
}

/**
 * Baris "label di kiri, nilai di kanan".
 * Jika label terlalu panjang untuk berbagi baris dengan nilainya, label turun
 * baris sendiri supaya kolom nilai tetap lurus pada semua baris struk.
 */
function labelValue(label: string, value: string, width: number): string[] {
  const labelWidth = Math.max(8, Math.floor(width / 2));

  if (label.length + 1 + value.length > width) {
    const head = wrap(label, labelWidth).map((line) => right(line, labelWidth));
    return [...head, right(value, width)];
  }

  const space = width - label.length - value.length;
  return [`${label}${' '.repeat(space)}${value}`];
}

/** Garis pemisah selebar kertas. */
function rule(width: number): string {
  return '-'.repeat(width);
}

/**
 * Susun teks struk selebar `width` karakter dari satu transaksi.
 *
 * `header` bersifat opsional — tanpa punya, struk tetap terbentuk lengkap
 * dengan nomor, tanggal, daftar barang, dan totalnya.
 *
 * Contoh hasil (width 32):
 * ```
 *            TOKO SERBAGIMA
 *             Jl. Merdeka 1
 *                08123456789
 * --------------------------------
 * No. Transaksi    TRX-20261002-0001
 * Tanggal          02 Okt 2026, 14:32
 * Kasir            Budi
 * --------------------------------
 * Pulpen Gel 0.5 mm
 * 2 x 2.500                    5.000
 * --------------------------------
 * Total item                    2
 * TOTAL Rp 5.000
 * Tunai                  Rp 10.000
 * Kembalian              Rp  5.000
 * --------------------------------
 *    Terima kasih telah berbelanja
 * ```
 */
export function buildReceiptText(
  transaction: Transaction,
  width = RECEIPT_WIDTH,
  header: ReceiptHeader = {},
): string {
  const out: string[] = [];

  // 1. Kepala toko, rata tengah.
  if (header.storeName) {
    out.push(center(header.storeName.trim(), width));
  }
  if (header.storeAddress) {
    out.push(...wrap(header.storeAddress.trim(), width).map((line) => center(line, width)));
  }
  if (header.phone) {
    out.push(center(header.phone.trim(), width));
  }
  if (out.length > 0) {
    out.push('', rule(width));
  }

  // 2. Info transaksi: label di kiri, nilai di kanan.
  out.push(...labelValue('No. Transaksi', transaction.code, width));
  out.push(...labelValue('Tanggal', formatDateTime(transaction.createdAt), width));
  if (header.cashierName) {
    out.push(...labelValue('Kasir', header.cashierName, width));
  }
  out.push(rule(width));

  // 3. Daftar barang: nama dulu, lalu "qty x harga" di kiri dan subtotal di kanan.
  let totalItem = 0;
  for (const item of transaction.items) {
    totalItem += item.quantity;
    out.push(...wrap(item.productName, width));
    out.push(
      ...labelValue(
        `${item.quantity} x ${formatRibuan(item.price)}`,
        formatRibuan(item.subtotal),
        width,
      ),
    );
  }
  out.push(rule(width));

  // 4. Ringkasan. Pembayaran tunai membawa uang yang diterima; QRIS dan
  //    transfer tidak, jadi barisnya memakai total.
  const paid = transaction.amountReceived ?? transaction.total;

  out.push(...labelValue('Total item', String(totalItem), width));
  out.push(`TOTAL ${formatRupiah(transaction.total)}`);
  out.push(
    ...labelValue(PAYMENT_METHOD_LABEL[transaction.paymentMethod], formatRupiah(paid), width),
  );
  if (transaction.changeAmount != null) {
    out.push(...labelValue('Kembalian', formatRupiah(transaction.changeAmount), width));
  }
  out.push(rule(width));

  // 5. Penutup, rata tengah.
  out.push(center('Terima kasih telah berbelanja', width));
  out.push(
    ...wrap('Barang yang sudah dibeli tidak dapat ditukar', width).map((line) =>
      center(line, width),
    ),
  );

  return out.join('\n');
}
