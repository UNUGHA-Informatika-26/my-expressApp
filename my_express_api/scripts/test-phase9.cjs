/* Uji alur lengkap Fase 9 — barang masuk, jual, stok berkurang, hutang, laporan.
 *
 * Jalankan: node scripts/test-phase9.cjs
 *
 * Uji ini memakai AKUN KHAS UJI (uji-fase9@tokokita.com) supaya semua sisa
 * data terisolasi dan tidak mengotori toko asli pemilik. Lalu jalankan
 * node scripts/clean-phase9.cjs untuk menghapus akun uji beserta isinya.
 */
const crypto = require('crypto');

const BASE = 'http://localhost:3000/api';
const TEST_EMAIL = 'uji-fase9@tokokita.com';
const TEST_PASSWORD = 'rahasia123';
const SECOND_EMAIL = 'uji-fase9b@tokokita.com';

let token = '';
let otherToken = '';
let pass = 0;
let fail = 0;

function ok(label, cond, extra) {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${label}`, extra === undefined ? '' : JSON.stringify(extra));
  }
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

async function req(method, path, body, useOther) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${useOther ? otherToken : token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function raw(path, useOther) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${useOther ? otherToken : token}` },
  });
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    status: res.status,
    contentType: res.headers.get('content-type') || '',
    bytes: buf,
    text: buf.toString('utf8'),
  };
}

function csvLines(text) {
  return text.replace(/^\uFEFF/, '').split('\r\n').filter((line) => line !== '');
}

function dayOffset(days) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/** Ambil (atau buat) akun uji beserta tokennya. */
async function ensureAccount(email, name) {
  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });
  if (login.status === 200) {
    const body = await login.json();
    return body.data.token;
  }

  const reg = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
    }),
  });
  const body = await reg.json().catch(() => null);
  if (reg.status !== 201) {
    console.log('Mendaftar akun uji gagal:', reg.status, JSON.stringify(body));
    process.exit(1);
  }
  return body.data.token;
}

async function main() {
  console.log('Menyiapkan akun khas uji...');
  token = await ensureAccount(TEST_EMAIL, 'Uji Fase 9');
  otherToken = await ensureAccount(SECOND_EMAIL, 'Uji Fase 9 B');
  console.log('Token utama dan akun kedua siap.');

  // ---------- A. Barang masuk ----------
  section('A. Barang masuk (produk dan stok awal)');

  const pA = await req('POST', '/products', {
    barcode: 'TEST9-A',
    name: 'Buku Tulis Sidu',
    category: 'Buku',
    price: 4500,
    stock: 10,
    minStock: 3,
  });
  ok('POST /products A -> 201', pA.status === 201, pA);
  const idA = pA.data?.data?.id;

  const pB = await req('POST', '/products', {
    barcode: 'TEST9-B',
    name: 'Pulpen Standard AE7',
    category: 'Alat Tulis',
    price: 2000,
    stock: 8,
    minStock: 3,
  });
  ok('POST /products B -> 201', pB.status === 201, pB);
  const idB = pB.data?.data?.id;

  const pC = await req('POST', '/products', {
    barcode: 'TEST9-C',
    name: 'Stabilo Hijau',
    category: 'Alat Tulis',
    price: 3500,
    stock: 1,
    minStock: 3,
  });
  ok('POST /products C -> 201', pC.status === 201, pC);
  const idC = pC.data?.data?.id;

  ok('stok awal A = 10', pA.data?.data?.stock === 10, pA.data?.data);
  ok('stockStatus A = aman', pA.data?.data?.stockStatus === 'aman', pA.data?.data?.stockStatus);
  ok('stok awal C = 1 (di bawah minStock) -> menipis', pC.data?.data?.stockStatus === 'menipis', pC.data?.data?.stockStatus);

  const dup = await req('POST', '/products', {
    barcode: 'TEST9-A',
    name: 'Barang Dupa',
    category: 'Buku',
    price: 1000,
    stock: 1,
    minStock: 1,
  });
  ok('barcode ganda dalam toko yang sama -> 409', dup.status === 409, dup);

  // Barang masuk: cukup kirim stock baru (04-api.md baris 34).
  const restock = await req('PUT', `/products/${idA}`, { stock: 25 });
  ok('PUT /products/:id { stock: 25 } -> 200', restock.status === 200, restock);
  ok('stok A naik menjadi 25', restock.data?.data?.stock === 25, restock.data?.data);
  ok('nama A tidak ikut berubah', restock.data?.data?.name === 'Buku Tulis Sidu', restock.data?.data?.name);

  // ---------- B. Jual, stok berkurang ----------
  section('B. Jual (checkout tunai) dan stok berkurang');

  // total = 4500*3 + 2000*2 = 17500; uang 20000 -> kembalian 2500.
  const sale = await req('POST', '/transactions/checkout', {
    paymentMethod: 'tunai',
    amountReceived: 20000,
    items: [
      { productId: idA, quantity: 3 },
      { productId: idB, quantity: 2 },
    ],
  });
  ok('checkout tunai -> 201', sale.status === 201, sale);
  const trxCode = sale.data?.data?.code;
  ok('total dihitung server = 17500', sale.data?.data?.total === 17500, sale.data?.data?.total);
  ok('kembalian = 2500', sale.data?.data?.changeAmount === 2500, sale.data?.data?.changeAmount);
  ok('uang diterima tersimpan = 20000', sale.data?.data?.amountReceived === 20000, sale.data?.data?.amountReceived);
  ok('metode bayar = tunai', sale.data?.data?.paymentMethod === 'tunai', sale.data?.data?.paymentMethod);
  ok('kode transaksi format TRX-YYYYMMDD-NNNN', /^TRX-\d{8}-\d{4}$/.test(trxCode || ''), trxCode);
  ok('respons memuat 2 baris item', sale.data?.data?.items?.length === 2, sale.data?.data?.items);

  const saleItems = sale.data?.data?.items ?? [];
  ok('item diurutkan nama menaik (Buku sebelum Pulpen)', saleItems[0]?.productName === 'Buku Tulis Sidu' && saleItems[1]?.productName === 'Pulpen Standard AE7', saleItems.map((i) => i.productName));
  ok('subtotal A = 13500', saleItems.find((i) => i.productName === 'Buku Tulis Sidu')?.subtotal === 13500, saleItems);
  ok('salinan harga ikut tersimpan', saleItems.find((i) => i.productName === 'Pulpen Standard AE7')?.price === 2000, saleItems);

  const afterA = await req('GET', `/products/${idA}`);
  const afterB = await req('GET', `/products/${idB}`);
  ok('stok A berkurang 25 -> 22', afterA.data?.data?.stock === 22, afterA.data?.data?.stock);
  ok('stok B berkurang 8 -> 6', afterB.data?.data?.stock === 6, afterB.data?.data?.stock);

  // ---------- C. Tolakan dan rollback ----------
  section('C. Penolakan transaksi (stok kurang, uang kurang, rollback)');

  const tooLittle = await req('POST', '/transactions/checkout', {
    paymentMethod: 'tunai',
    amountReceived: 999999,
    items: [{ productId: idA, quantity: 999 }],
  });
  ok('stok tidak cukup -> 422', tooLittle.status === 422, tooLittle);
  ok('pesan menyebut produk yang kurang', String(tooLittle.data?.message || '').includes('Buku Tulis Sidu'), tooLittle.data?.message);
  ok('stok A tetap 22 (ditolak, tidak berubah)', (await req('GET', `/products/${idA}`)).data?.data?.stock === 22);

  const notEnoughCash = await req('POST', '/transactions/checkout', {
    paymentMethod: 'tunai',
    amountReceived: 1000,
    items: [{ productId: idB, quantity: 1 }],
  });
  ok('uang tunai kurang -> 422', notEnoughCash.status === 422, notEnoughCash);
  ok('pesan menyebut uang kurang', String(notEnoughCash.data?.message || '').toLowerCase().includes('uang tunai kurang'), notEnoughCash.data?.message);
  ok('stok B tetap 6', (await req('GET', `/products/${idB}`)).data?.data?.stock === 6);

  // Uji terpenting: satu item sah + satu item stok kurang dalam keranjang yang
  // sama. Kalau transaksi database bekerja, item sah TIDAK boleh terlanjur
  // terjual dan stoknya tidak boleh berubah.
  const mixed = await req('POST', '/transactions/checkout', {
    paymentMethod: 'tunai',
    amountReceived: 999999,
    items: [
      { productId: idA, quantity: 1 },
      { productId: idC, quantity: 999 },
    ],
  });
  ok('keranjang campuran (1 sah + 1 stok kurang) -> 422', mixed.status === 422, mixed);
  ok('ROLLBACK: stok A tidak ikut berkurang, tetap 22', (await req('GET', `/products/${idA}`)).data?.data?.stock === 22);
  ok('ROLLBACK: stok C tetap 1', (await req('GET', `/products/${idC}`)).data?.data?.stock === 1);

  const unknownProduct = await req('POST', '/transactions/checkout', {
    paymentMethod: 'tunai',
    amountReceived: 50000,
    items: [{ productId: crypto.randomUUID(), quantity: 1 }],
  });
  ok('produk tidak ditemukan -> 422', unknownProduct.status === 422, unknownProduct);

  const noAmount = await req('POST', '/transactions/checkout', {
    paymentMethod: 'tunai',
    items: [{ productId: idA, quantity: 1 }],
  });
  ok('tunai tanpa amountReceived -> 400', noAmount.status === 400, noAmount);

  const zeroQty = await req('POST', '/transactions/checkout', {
    paymentMethod: 'tunai',
    amountReceived: 5000,
    items: [{ productId: idA, quantity: 0 }],
  });
  ok('quantity 0 -> 400', zeroQty.status === 400, zeroQty);

  const emptyCart = await req('POST', '/transactions/checkout', {
    paymentMethod: 'tunai',
    amountReceived: 5000,
    items: [],
  });
  ok('keranjang kosong -> 400', emptyCart.status === 400, emptyCart);

  const badMethod = await req('POST', '/transactions/checkout', {
    paymentMethod: 'uang-emas',
    amountReceived: 5000,
    items: [{ productId: idA, quantity: 1 }],
  });
  ok('metode bayar di luar daftar -> 400', badMethod.status === 400, badMethod);

  // ---------- D. Metode bayar lain ----------
  section('D. Metode bayar QRIS dan Transfer');

  const qris = await req('POST', '/transactions/checkout', {
    paymentMethod: 'qris',
    items: [{ productId: idA, quantity: 1 }],
  });
  ok('checkout qris tanpa amountReceived -> 201', qris.status === 201, qris);
  ok('qris: amountReceived null', qris.data?.data?.amountReceived === null, qris.data?.data?.amountReceived);
  ok('qris: changeAmount null', qris.data?.data?.changeAmount === null, qris.data?.data?.changeAmount);
  ok('stok A berkurang 22 -> 21', (await req('GET', `/products/${idA}`)).data?.data?.stock === 21);

  const transfer = await req('POST', '/transactions/checkout', {
    paymentMethod: 'transfer',
    items: [{ productId: idB, quantity: 1 }],
  });
  ok('checkout transfer -> 201', transfer.status === 201, transfer);
  ok('stok B berkurang 6 -> 5', (await req('GET', `/products/${idB}`)).data?.data?.stock === 5);

  const onlyQris = await req('GET', '/transactions?paymentMethod=qris');
  const qrisCodes = (onlyQris.data?.data ?? []).flatMap((g) => g.transactions.map((t) => t.code));
  ok('filter paymentMethod=qris hanya berisi qris', qrisCodes.length === 1 && qrisCodes[0] === qris.data?.data?.code, qrisCodes);

  // ---------- E. Stok habis -> notifikasi ----------
  section('E. Terjual sampai habis muncul sebagai notifikasi');

  const lastC = await req('POST', '/transactions/checkout', {
    paymentMethod: 'tunai',
    amountReceived: 3500,
    items: [{ productId: idC, quantity: 1 }],
  });
  ok('jual C sampai habis -> 201', lastC.status === 201, lastC);
  const cNow = await req('GET', `/products/${idC}`);
  ok('stok C = 0', cNow.data?.data?.stock === 0, cNow.data?.data);
  ok('stockStatus C = habis', cNow.data?.data?.stockStatus === 'habis', cNow.data?.data?.stockStatus);

  const notif = await req('GET', '/notifications');
  const notifItems = notif.data?.data?.items ?? [];
  const habisItem = notifItems.find((i) => i.barcode === 'TEST9-C');
  ok('GET /notifications memuat stok_habis untuk TEST9-C', habisItem?.type === 'stok_habis', habisItem);
  ok('notifikasi memuat nama produk', habisItem?.productName === 'Stabilo Hijau', habisItem);

  // ---------- F. Hutang distributor ----------
  section('F. Hutang distributor dari awal sampai lunas');

  const dist = await req('POST', '/distributors', { name: 'CV Uji Fase 9', phone: '081234567890' });
  ok('POST /distributors -> 201', dist.status === 201, dist);
  const distId = dist.data?.data?.id;

  const debt = await req('POST', '/debts', {
    distributorId: distId,
    invoiceNumber: 'INV-9-001',
    totalAmount: 500000,
    dueDate: dayOffset(10),
  });
  ok('POST /debts -> 201', debt.status === 201, debt);
  const debtId = debt.data?.data?.id;
  ok('paidAmount awal = 0', debt.data?.data?.paidAmount === 0, debt.data?.data?.paidAmount);
  ok('remaining awal = 500000', debt.data?.data?.remaining === 500000, debt.data?.data?.remaining);
  ok('status awal = belum_lunas', debt.data?.data?.status === 'belum_lunas', debt.data?.data?.status);
  ok('nama distributor terisi', debt.data?.data?.distributorName === 'CV Uji Fase 9', debt.data?.data?.distributorName);

  const listBefore = await req('GET', '/debts');
  ok('summary.totalOutstanding = 500000', listBefore.data?.data?.summary?.totalOutstanding === 500000, listBefore.data?.data?.summary);

  const foreignDist = await req('POST', '/debts', {
    distributorId: crypto.randomUUID(),
    invoiceNumber: 'INV-9-ASING',
    totalAmount: 1000,
    dueDate: dayOffset(5),
  });
  ok('distributor bukan milik toko -> 404', foreignDist.status === 404, foreignDist);

  const pay1 = await req('POST', `/debts/${debtId}/payments`, { amount: 200000, note: 'Bayar cicilan pertama' });
  ok('bayar sebagian 200000 -> 201', pay1.status === 201, pay1);
  ok('sisa menjadi 300000', pay1.data?.data?.debt?.remaining === 300000, pay1.data?.data?.debt?.remaining);
  ok('masih belum_lunas', pay1.data?.data?.debt?.status === 'belum_lunas', pay1.data?.data?.debt?.status);
  ok('catatan pembayaran tersimpan', pay1.data?.data?.payment?.note === 'Bayar cicilan pertama', pay1.data?.data?.payment);

  const overpay = await req('POST', `/debts/${debtId}/payments`, { amount: 400000 });
  ok('bayar melebihi sisa -> 422', overpay.status === 422, overpay);
  ok('sisa tidak berubah setelah ditolak', (await req('GET', `/debts/${debtId}`)).data?.data?.remaining === 300000);

  const pay2 = await req('POST', `/debts/${debtId}/payments`, { amount: 300000 });
  ok('bayar sisa -> 201', pay2.status === 201, pay2);
  ok('sisa menjadi 0', pay2.data?.data?.debt?.remaining === 0, pay2.data?.data?.debt?.remaining);
  ok('status menjadi lunas', pay2.data?.data?.debt?.status === 'lunas', pay2.data?.data?.debt?.status);

  const payAgain = await req('POST', `/debts/${debtId}/payments`, { amount: 1000 });
  ok('bayar hutang yang sudah lunas -> 422', payAgain.status === 422, payAgain);

  const detail = await req('GET', `/debts/${debtId}`);
  ok('detail memuat 2 riwayat pembayaran', detail.data?.data?.payments?.length === 2, detail.data?.data?.payments?.length);
  ok('riwayat diurut terbaru dulu', detail.data?.data?.payments?.[0]?.amount === 300000, detail.data?.data?.payments);

  const listAfter = await req('GET', '/debts?status=lunas');
  ok('hutang lunas muncul di filter lunas', (listAfter.data?.data?.items ?? []).some((d) => d.id === debtId));
  ok('summary.totalOutstanding = 0 setelah lunas', listAfter.data?.data?.summary?.totalOutstanding === 0, listAfter.data?.data?.summary);

  // ---------- G. Dashboard dan laporan ----------
  section('G. Dashboard dan laporan CSV');

  // Hari WIB diambil dari riwayat supaya tidak meleset dengan zona waktu.
  const history = await req('GET', '/transactions');
  const groups = history.data?.data ?? [];
  const todayWib = groups[0]?.date;
  const allToday = groups.flatMap((g) => g.transactions);
  const expectedSales = allToday.reduce((sum, t) => sum + t.total, 0);
  ok(`ada transaksi hari ini WIB (${todayWib})`, typeof todayWib === 'string' && allToday.length === 4, allToday.map((t) => t.code));

  const dash = await req('GET', '/dashboard');
  ok('GET /dashboard -> 200', dash.status === 200, dash);
  ok(`todaySales === jumlah total (${expectedSales})`, dash.data?.data?.todaySales === expectedSales, { got: dash.data?.data?.todaySales, expected: expectedSales });
  ok('transactionCount === 4', dash.data?.data?.transactionCount === 4, dash.data?.data?.transactionCount);
  ok('itemsSold === 8 (3+2+1+1+1)', dash.data?.data?.itemsSold === 8, dash.data?.data?.itemsSold);
  ok('lowStockCount >= 1', (dash.data?.data?.lowStockCount ?? 0) >= 1, dash.data?.data?.lowStockCount);
  const due = dash.data?.data?.dueDebts ?? {};
  ok(
    'dueDebts semua 0 karena hutang sudah lunas',
    due.overdueCount === 0 && due.overdueAmount === 0 && due.dueIn7DaysCount === 0 && due.dueIn7DaysAmount === 0,
    due,
  );
  ok('chart7Days memuat hari ini', (dash.data?.data?.chart7Days ?? []).some((c) => c.date === todayWib), dash.data?.data?.chart7Days);

  const reportTrx = await raw(`/reports/transactions?from=${todayWib}&to=${todayWib}`);
  ok('laporan transaksi -> 200', reportTrx.status === 200, { status: reportTrx.status });
  const reportLines = csvLines(reportTrx.text);
  ok('memuat kode transaksi uji', reportLines.some((l) => l.includes(trxCode)), reportLines);
  const totalCell = reportLines[reportLines.length - 1].split(',');
  ok(`TOTAL laporan === ${expectedSales}`, Number(totalCell[5]) === expectedSales, { cell: totalCell[5], expected: expectedSales });

  const reportStock = await raw('/reports/stock');
  const stockLines = csvLines(reportStock.text);
  const lineA = stockLines.find((l) => l.startsWith('TEST9-A,'));
  const lineC = stockLines.find((l) => l.startsWith('TEST9-C,'));
  ok('laporan stok memuat A dengan stok 21 Aman', typeof lineA === 'string' && lineA.includes(',21,3,Aman'), lineA);
  ok('laporan stok memuat C dengan stok 0 Habis', typeof lineC === 'string' && lineC.includes(',0,3,Habis'), lineC);

  // ---------- H. Batas pemilik toko ----------
  section('H. Data tidak bocor antar pemilik toko');

  const otherSeesA = await req('GET', `/products/${idA}`, undefined, true);
  ok('akun lain: GET /products/:id -> 404', otherSeesA.status === 404, otherSeesA);

  const otherBarcode = await req('GET', '/products/barcode/TEST9-A', undefined, true);
  ok('akun lain: GET /products/barcode/TEST9-A -> 404', otherBarcode.status === 404, otherBarcode);

  const otherDebt = await req('GET', `/debts/${debtId}`, undefined, true);
  ok('akun lain: GET /debts/:id -> 404', otherDebt.status === 404, otherDebt);

  const otherPay = await req('POST', `/debts/${debtId}/payments`, { amount: 1 }, true);
  ok('akun lain: POST /debts/:id/payments -> 404', otherPay.status === 404, otherPay);

  const otherDelete = await req('DELETE', `/products/${idA}`, undefined, true);
  ok('akun lain: DELETE /products/:id -> 404', otherDelete.status === 404, otherDelete);

  const otherTrx = await req('GET', '/transactions', undefined, true);
  const otherCodes = (otherTrx.data?.data ?? []).flatMap((g) => g.transactions.map((t) => t.code));
  ok('akun lain tidak melihat transaksi uji', otherCodes.every((c) => !String(c).startsWith('TRX-')), otherCodes);

  const otherDash = await req('GET', '/dashboard', undefined, true);
  ok('akun lain: todaySales = 0', otherDash.data?.data?.todaySales === 0, otherDash.data?.data?.todaySales);

  // Barcode yang sama BOLEH dipakai akun lain (unik per pemilik toko).
  const sameBarcodeOther = await req('POST', '/products', {
    barcode: 'TEST9-A',
    name: 'Milik Toko Lain',
    category: 'Buku',
    price: 9999,
    stock: 1,
    minStock: 1,
  }, true);
  ok('barcode sama di toko lain -> 201 (unik per pemilik toko)', sameBarcodeOther.status === 201, sameBarcodeOther);

  const backToMain = await req('GET', '/products/barcode/TEST9-A');
  ok('toko asli tetap melihat produknya sendiri', backToMain.data?.data?.name === 'Buku Tulis Sidu', backToMain.data?.data);

  console.log(`\nRingkasan: ${pass} lulus, ${fail} gagal`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Gagal menjalankan uji:', error);
  process.exit(1);
});
