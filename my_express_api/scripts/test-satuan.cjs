/*
 * Uji alur satuan produk (docs/03-database.md dan 04-api.md).
 * Jalankan setelah server hidup: node scripts/test-satuan.cjs
 *
 * Memakai akun khusus uji dan membersihkan produk uji yang dibuatnya.
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const BASE = process.env.TEST_API_URL ?? 'http://localhost:3000';

// Dipakai membersihkan transaksi uji; memang tidak ada endpoint hapus transaksi.
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const hasil = [];
function catat(nama, lolos, keterangan) {
  hasil.push({ nama, lolos, keterangan });
  console.log(`${lolos ? 'OK  ' : 'GAGAL'} | ${nama} — ${keterangan}`);
}

async function json(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function main() {
  const login = await json(`${BASE}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'budi@tokokita.com', password: 'rahasia123' }),
  });
  if (login.status !== 200) {
    throw new Error(`Login gagal (status ${login.status}). Pastikan server sudah hidup.`);
  }
  const token = login.body.data.token;
  const auth = { Authorization: `Bearer ${token}` };

  const barcode = `UJI-SATUAN-${Date.now()}`;

  // 1. Produk lama tetap memegang satuan bawaan "pcs".
  const daftar = await json(`${BASE}/api/products`, { headers: auth });
  const adaSatuan = daftar.body.data.every((p) => typeof p.satuan === 'string');
  catat(
    'Daftar produk memuat satuan',
    daftar.status === 200 && adaSatuan,
    `${daftar.body.data.length} produk, semua punya satuan: ${adaSatuan}`,
  );

  // 2. Membuat produk dengan satuan umum.
  const dibuat = await json(`${BASE}/api/products`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      barcode,
      name: 'Kertas HVS Uji',
      category: 'Kertas',
      satuan: 'rim',
      price: 55000,
      stock: 100,
      minStock: 5,
    }),
  });
  catat(
    'Buat produk satuan "rim"',
    dibuat.status === 201 && dibuat.body.data.satuan === 'rim',
    `status ${dibuat.status}, satuan "${dibuat.body.data?.satuan}"`,
  );

  // 3. Membuat produk TANPA satuan harus ditolak.
  const tanpaSatuan = await json(`${BASE}/api/products`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      barcode: `${barcode}-X`,
      name: 'Tanpa Satuan Uji',
      category: 'Kertas',
      price: 1000,
      stock: 1,
      minStock: 0,
    }),
  });
  catat(
    'Tanpa satuan ditolak 400',
    tanpaSatuan.status === 400,
    `status ${tanpaSatuan.status}`,
  );

  // 4. Satuan di luar daftar umum tetap diterima (teks bebas).
  const bebas = await json(`${BASE}/api/products`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      barcode: `${barcode}-B`,
      name: 'Karung Beras Uji',
      category: 'Lainnya',
      satuan: 'karung',
      price: 2000,
      stock: 3,
      minStock: 1,
    }),
  });
  catat(
    'Satuan bebas "karung" diterima',
    bebas.status === 201 && bebas.body.data.satuan === 'karung',
    `status ${bebas.status}, satuan "${bebas.body.data?.satuan}"`,
  );

  // 5. Satuan melebihi 20 karakter ditolak.
  const kepanjangan = await json(`${BASE}/api/products`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      barcode: `${barcode}-P`,
      name: 'Satuan Panjang Uji',
      category: 'Lainnya',
      satuan: 'x'.repeat(21),
      price: 1000,
      stock: 1,
      minStock: 0,
    }),
  });
  catat(
    'Satuan 21 karakter ditolak 400',
    kepanjangan.status === 400,
    `status ${kepanjangan.status}`,
  );

  // 6. Mengubah satuan lewat PUT.
  const diubah = await json(`${BASE}/api/products/${dibuat.body.data.id}`, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ satuan: 'lembar' }),
  });
  catat(
    'Ubah satuan jadi "lembar"',
    diubah.status === 200 && diubah.body.data.satuan === 'lembar',
    `status ${diubah.status}, satuan "${diubah.body.data?.satuan}"`,
  );

  // 7. Laporan stok menyertakan kolom Satuan.
  const laporan = await fetch(`${BASE}/api/reports/stock`, { headers: auth });
  const csv = await laporan.text();
  catat(
    'Laporan stok memuat kolom Satuan',
    laporan.status === 200 && csv.split('\n')[0].includes('Satuan'),
    `status ${laporan.status}, header: ${csv.split('\n')[0]}`,
  );

  // 8. Checkout MENYALIN satuan dari produk ke transaction_items.
  //    Aplikasi tidak mengirim satuan — hanya productId dan quantity.
  const checkout = await json(`${BASE}/api/transactions/checkout`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      paymentMethod: 'qris',
      items: [{ productId: dibuat.body.data.id, quantity: 2 }],
    }),
  });
  const itemBaru = checkout.body.data?.items?.[0];
  catat(
    'Checkout menyalin satuan ke item',
    checkout.status === 201 && itemBaru?.satuan === 'lembar',
    `status ${checkout.status}, satuan item "${itemBaru?.satuan}" (diharapkan "lembar")`,
  );

  // 9. Salinan satuan ikut tersimpan di database, bukan cuma di respons.
  if (checkout.status === 201) {
    await sequelize.authenticate();
    const [[tersimpan]] = await sequelize.query(
      'SELECT satuan FROM transaction_items WHERE transaction_id = :id',
      { replacements: { id: checkout.body.data.id } },
    );
    catat(
      'Satuan tersimpan di transaction_items',
      tersimpan?.satuan === 'lembar',
      `nilai tersimpan "${tersimpan?.satuan}"`,
    );

    // Transaksi uji dihapus; itemnya ikut terhapus lewat ON DELETE CASCADE.
    await sequelize.query('DELETE FROM transactions WHERE id = :id', {
      replacements: { id: checkout.body.data.id },
    });
  }

  // Bersihkan seluruh produk uji.
  for (const code of [barcode, `${barcode}-X`, `${barcode}-B`, `${barcode}-P`]) {
    const cari = await json(`${BASE}/api/products?search=${code}`, { headers: auth });
    for (const p of cari.body.data ?? []) {
      await json(`${BASE}/api/products/${p.id}`, { method: 'DELETE', headers: auth });
    }
  }

  const gagal = hasil.filter((h) => !h.lolos);
  console.log('\nRingkasan:', hasil.length - gagal.length, 'lulus,', gagal.length, 'gagal');
  process.exit(gagal.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('Gagal:', error.message);
  process.exit(1);
});
