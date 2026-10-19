/* Uji API Fase 8 — notifikasi dan laporan CSV. Jalankan: node scripts/test-phase8.cjs */
const BASE = 'http://localhost:3000/api';
const EMAIL = 'budi@tokokita.com';
const PASSWORD = 'rahasia123';

let token = '';
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

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

/** Ambil respons mentah (untuk CSV) beserta header-nya. */
async function raw(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    status: res.status,
    contentType: res.headers.get('content-type') || '',
    disposition: res.headers.get('content-disposition') || '',
    // Dipotong manual: res.text() memakai decoder WHATWG yang membuang BOM,
    // sehingga kalau dites lewat teks, BOM akan tampak hilang padahal ada.
    bytes: buf,
    text: buf.toString('utf8'),
  };
}

/** Tanggal WIB `YYYY-MM-DD` sejumlah hari dari sekarang (untuk uji jatuh tempo). */
function dayOffset(days) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/** Baris CSV: buang BOM, potong CRLF. */
function csvLines(text) {
  return text.replace(/^\uFEFF/, '').split('\r\n').filter((line) => line !== '');
}

async function main() {
  console.log('Login...');
  const login = await req('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  if (login.status !== 200) {
    console.log('Login gagal:', login.status, JSON.stringify(login.data));
    process.exit(1);
  }
  token = login.data.data.token;
  console.log('Token OK\n');

  // ---------- Data uji ----------
  console.log('=== Siapkan data uji ===');
  const habis = await req('POST', '/products', {
    barcode: 'TEST8-HABIS',
    name: 'Kertas HVS A4 Habisi',
    category: 'Kertas',
    price: 5000,
    stock: 0,
    minStock: 2,
  });
  ok('POST /products stok 0 -> 201', habis.status === 201, habis);

  const menipis = await req('POST', '/products', {
    // Nama sengaja memuat koma dan tanda kutip untuk menguji escaping CSV.
    barcode: 'TEST8-MENIPIS',
    name: 'Pensil "2B", isi 12',
    category: 'Alat Tulis',
    price: 2000,
    stock: 1,
    minStock: 5,
  });
  ok('POST /products stok menipis -> 201', menipis.status === 201, menipis);

  const aman = await req('POST', '/products', {
    barcode: 'TEST8-AMAN',
    name: 'Pulpen Biru Aman',
    category: 'Alat Tulis',
    price: 3000,
    stock: 50,
    minStock: 5,
  });
  ok('POST /products stok aman -> 201', aman.status === 201, aman);

  const dist = await req('POST', '/distributors', { name: 'CV Uji Fase 8', phone: '08111111111' });
  ok('POST /distributors -> 201', dist.status === 201, dist);
  const distId = dist.data?.data?.id;

  const overdueDebt = await req('POST', '/debts', {
    distributorId: distId,
    invoiceNumber: 'INV-F8-LEWAT',
    totalAmount: 150000,
    dueDate: dayOffset(-5),
  });
  ok('POST /debts lewat tempo -> 201', overdueDebt.status === 201, overdueDebt);

  const dueSoonDebt = await req('POST', '/debts', {
    distributorId: distId,
    invoiceNumber: 'INV-F8-SEGERA',
    totalAmount: 80000,
    dueDate: dayOffset(3),
  });
  ok('POST /debts jatuh tempo 3 hari -> 201', dueSoonDebt.status === 201, dueSoonDebt);

  const farDebt = await req('POST', '/debts', {
    distributorId: distId,
    invoiceNumber: 'INV-F8-JAUH',
    totalAmount: 60000,
    dueDate: dayOffset(60),
  });
  ok('POST /debts jauh -> 201', farDebt.status === 201, farDebt);

  // ---------- Notifikasi ----------
  console.log('\n=== GET /notifications ===');
  const notifNoToken = await fetch(`${BASE}/notifications`);
  ok('tanpa token -> 401', notifNoToken.status === 401);

  const notif = await req('GET', '/notifications');
  ok('GET /notifications -> 200', notif.status === 200, notif);
  const items = notif.data?.data?.items ?? [];
  ok('count === items.length', notif.data?.data?.count === items.length, notif.data);

  const types = items.map((i) => i.type);
  ok('ada type stok_habis', types.includes('stok_habis'), types);
  ok('ada type stok_menipis', types.includes('stok_menipis'), types);
  ok('ada type hutang_jatuh_tempo', types.includes('hutang_jatuh_tempo'), types);

  // Urutan: stok_habis -> stok_menipis -> hutang_jatuh_tempo.
  const rank = { stok_habis: 0, stok_menipis: 1, hutang_jatuh_tempo: 2 };
  let ordered = true;
  for (let i = 1; i < types.length; i += 1) {
    if (rank[types[i]] < rank[types[i - 1]]) ordered = false;
  }
  ok('urutan paling mendesak dulu', ordered, types);

  const habisItem = items.find((i) => i.type === 'stok_habis');
  ok('item habis: productId terisi', typeof habisItem?.productId === 'string', habisItem);
  ok('item habis: stock 0', habisItem?.stock === 0, habisItem);
  ok('item habis: judul "Stok habis"', habisItem?.title === 'Stok habis', habisItem);
  ok('item habis: punya message', typeof habisItem?.message === 'string' && habisItem.message.length > 0, habisItem);

  const menipisItem = items.find((i) => i.type === 'stok_menipis');
  ok('item menipis: minStock terisi', menipisItem?.minStock === 5, menipisItem);
  ok('item menipis: nama produk terisi', menipisItem?.productName === 'Pensil "2B", isi 12', menipisItem);

  const debtItems = items.filter((i) => i.type === 'hutang_jatuh_tempo');
  ok('hutang: 2 item (lewat tempo + 3 hari), yang 60 hari tidak muncul', debtItems.length === 2, debtItems.map((d) => d.invoiceNumber));
  ok('hutang: tanpa produk tercampur', debtItems.every((d) => d.productId === undefined), debtItems);
  ok('hutang: sisa terkirim', typeof debtItems[0]?.remaining === 'number', debtItems[0]);
  ok('hutang: isOverdue terkirim', typeof debtItems[0]?.isOverdue === 'boolean', debtItems[0]);

  const farIncluded = items.some((i) => i.invoiceNumber === 'INV-F8-JAUH');
  ok('hutang jauh (60 hari) TIDAK muncul', farIncluded === false, items.map((i) => i.invoiceNumber));
  const amanIncluded = items.some((i) => i.barcode === 'TEST8-AMAN');
  ok('produk aman TIDAK muncul', amanIncluded === false, items.map((i) => i.barcode));

  const ids = items.map((i) => i.id);
  ok('setiap item punya id unik', new Set(ids).size === ids.length, ids);

  // ---------- Laporan transaksi ----------
  console.log('\n=== GET /reports/transactions ===');
  const trxNoToken = await fetch(`${BASE}/reports/transactions`);
  ok('tanpa token -> 401', trxNoToken.status === 401);

  const trx = await raw('/reports/transactions');
  ok('-> 200', trx.status === 200, { status: trx.status, text: trx.text.slice(0, 120) });
  ok('Content-Type teks CSV', trx.contentType.includes('text/csv'), trx.contentType);
  ok('ada nama file unduhan', /filename="laporan-transaksi[^"]*\.csv"/.test(trx.disposition), trx.disposition);
  ok(
    'diawali BOM UTF-8 (EF BB BF)',
    trx.bytes[0] === 0xef && trx.bytes[1] === 0xbb && trx.bytes[2] === 0xbf,
    Array.from(trx.bytes.subarray(0, 3)),
  );
  ok('baris pertama judul kolom', csvLines(trx.text)[0] === 'Tanggal,Jam,Kode,Metode Bayar,Jumlah Item,Total,Uang Diterima,Kembalian', csvLines(trx.text)[0]);

  const trxList = await req('GET', '/transactions');
  const expectedRows = (trxList.data?.data ?? []).reduce((sum, g) => sum + g.transactions.length, 0);
  const lines = csvLines(trx.text);
  const dataLines = lines.slice(1, -1); // buang judul dan TOTAL
  ok(`jumlah baris data === jumlah transaksi (${expectedRows})`, dataLines.length === expectedRows, dataLines.length);
  ok('baris terakhir TOTAL', lines[lines.length - 1].includes('TOTAL'), lines[lines.length - 1]);

  // TOTAL kolom ke-6 (index 5) harus sama dengan jumlah kolom Total tiap baris.
  const sumOfTotals = dataLines.reduce((sum, line) => {
    const cells = line.split(',');
    return sum + Number(cells[5] ?? 0);
  }, 0);
  const totalCells = lines[lines.length - 1].split(',');
  ok('baris TOTAL: kolom Kode = "TOTAL"', totalCells[2] === 'TOTAL', totalCells);
  ok(
    `TOTAL === jumlah kolom Total (${sumOfTotals})`,
    Number(totalCells[5]) === sumOfTotals,
    { total: totalCells[5], sum: sumOfTotals },
  );
  ok(
    'TOTAL: jumlah item juga dijumlahkan',
    Number(totalCells[4]) ===
      dataLines.reduce((sum, line) => sum + Number(line.split(',')[4] ?? 0), 0),
    totalCells[4],
  );

  const trxBad = await raw('/reports/transactions?from=31-12-2026');
  ok('from format salah -> 400', trxBad.status === 400, { status: trxBad.status, text: trxBad.text.slice(0, 80) });

  // from harus lebih awal dari to; kalau dibalik, 400.
  const trxRangeBad = await raw(
    `/reports/transactions?from=${dayOffset(2)}&to=${dayOffset(1)}`,
  );
  ok('from > to -> 400', trxRangeBad.status === 400, { status: trxRangeBad.status, text: trxRangeBad.text.slice(0, 80) });

  // Rentang valid tapi tanpa transaksi: hanya judul + baris TOTAL.
  const trxEmpty = await raw(
    `/reports/transactions?from=${dayOffset(1)}&to=${dayOffset(2)}`,
  );
  ok('rentang valid tanpa transaksi -> 200', trxEmpty.status === 200, trxEmpty.status);
  ok(
    'hanya judul + TOTAL',
    csvLines(trxEmpty.text).length === 2 && csvLines(trxEmpty.text)[1].includes('TOTAL'),
    csvLines(trxEmpty.text),
  );

  // ---------- Laporan stok ----------
  console.log('\n=== GET /reports/stock ===');
  const stockNoToken = await fetch(`${BASE}/reports/stock`);
  ok('tanpa token -> 401', stockNoToken.status === 401);

  const stock = await raw('/reports/stock');
  ok('-> 200', stock.status === 200, { status: stock.status, text: stock.text.slice(0, 120) });
  ok('Content-Type teks CSV', stock.contentType.includes('text/csv'), stock.contentType);
  ok('ada nama file unduhan', /filename="laporan-stok\.csv"/.test(stock.disposition), stock.disposition);

  const stockLines = csvLines(stock.text);
  ok('baris pertama judul kolom', stockLines[0] === 'Barcode,Nama,Kategori,Harga,Stok,Stok Minimum,Status', stockLines[0]);
  ok(
    'escaping koma dan kutip benar',
    stockLines.some((l) => l.includes('"Pensil ""2B"", isi 12"')),
    stockLines,
  );
  ok('produk aman ikut tercatat', stockLines.some((l) => l.startsWith('TEST8-AMAN,')), stockLines);
  ok('status habis ditulis "Habis"', stockLines.some((l) => l.endsWith(',Habis')), stockLines);
  ok('status aman ditulis "Aman"', stockLines.some((l) => l.endsWith(',Aman')), stockLines);
  ok('stok habis di baris paling atas setelah judul', stockLines[1].startsWith('TEST8-HABIS,'), stockLines[1]);

  console.log(`\nRingkasan: ${pass} lulus, ${fail} gagal`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Gagal menjalankan uji:', error);
  process.exit(1);
});
