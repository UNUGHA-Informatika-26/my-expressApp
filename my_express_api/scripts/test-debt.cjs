/* Uji API Fase 7 — hutang distributor. Jalankan: node scripts/test-debt.cjs */
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

async function main() {
  console.log('Login...');
  const login = await req('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  if (login.status !== 200) {
    console.log('Login gagal:', login.status, JSON.stringify(login.data));
    process.exit(1);
  }
  token = login.data.data.token;
  console.log('Token OK\n');

  // ---------- Distributor ----------
  console.log('=== Distributor ===');
  const dist = await req('POST', '/distributors', { name: 'CV Sumber ATK', phone: '08123456789' });
  ok('POST /distributors -> 201', dist.status === 201, dist);
  const distId = dist.data?.data?.id;
  ok('punya id', typeof distId === 'string', dist.data);

  const distBad = await req('POST', '/distributors', { name: '' });
  ok('POST /distributors nama kosong -> 400 (validasi skema)', distBad.status === 400, distBad);

  const distList = await req('GET', '/distributors');
  ok('GET /distributors -> 200', distList.status === 200, distList);
  ok('daftar berisi distributor baru', distList.data?.data?.some((d) => d.id === distId));

  // ---------- Hutang: tambah ----------
  console.log('\n=== Tambah hutang ===');
  const debt = await req('POST', '/debts', {
    distributorId: distId,
    invoiceNumber: 'INV-001',
    totalAmount: 100000,
    dueDate: '2026-10-01', // lewat tempo (sebelum hari ini 2026-10-10)
  });
  ok('POST /debts -> 201', debt.status === 201, debt);
  const debtId = debt.data?.data?.id;
  ok('status awal belum_lunas', debt.data?.data?.status === 'belum_lunas', debt.data);
  ok('remaining 100000', debt.data?.data?.remaining === 100000, debt.data);
  ok('isOverdue true (2026-10-01 < hari ini)', debt.data?.data?.isOverdue === true, debt.data);

  const debtBad = await req('POST', '/debts', {
    distributorId: distId,
    invoiceNumber: 'INV-002',
    totalAmount: 0,
    dueDate: '2026-12-01',
  });
  ok('totalAmount 0 -> 400 (validasi skema)', debtBad.status === 400, debtBad);

  const debtBadDate = await req('POST', '/debts', {
    distributorId: distId,
    invoiceNumber: 'INV-003',
    totalAmount: 5000,
    dueDate: '2026-02-30',
  });
  ok('tanggal tidak valid -> 400 (validasi skema)', debtBadDate.status === 400, debtBadDate);

  // hutang kedua: jatuh tempo 7 hari ke depan
  const debtSoon = await req('POST', '/debts', {
    distributorId: distId,
    invoiceNumber: 'INV-002',
    totalAmount: 50000,
    dueDate: '2026-10-14',
  });
  ok('hutang jatuh tempo 7 hari -> 201', debtSoon.status === 201, debtSoon);

  // ---------- Daftar ----------
  console.log('\n=== Daftar hutang ===');
  const all = await req('GET', '/debts');
  ok('GET /debts -> 200', all.status === 200, all);
  ok('punya summary', typeof all.data?.data?.summary?.totalOutstanding === 'number', all.data);
  ok('items array', Array.isArray(all.data?.data?.items), all.data);
  ok(
    'ada distributorName di item',
    all.data?.data?.items?.every((i) => typeof i.distributorName === 'string'),
    all.data?.data?.items?.[0],
  );
  ok(
    'summary.totalOutstanding = 150000',
    all.data?.data?.summary?.totalOutstanding === 150000,
    all.data?.data?.summary,
  );
  ok(
    'summary.overdueAmount = 100000',
    all.data?.data?.summary?.overdueAmount === 100000,
    all.data?.data?.summary,
  );
  ok(
    'summary.dueIn7DaysAmount = 50000',
    all.data?.data?.summary?.dueIn7DaysAmount === 50000,
    all.data?.data?.summary,
  );

  const belum = await req('GET', '/debts?status=belum_lunas');
  ok('filter belum_lunas -> semua belum lunas',
    belum.data?.data?.items?.every((i) => i.status === 'belum_lunas'), belum.data);

  const lunas = await req('GET', '/debts?status=lunas');
  ok('filter lunas -> semua lunas', lunas.data?.data?.items?.every((i) => i.status === 'lunas'), lunas.data);

  const badFilter = await req('GET', '/debts?status=abc');
  ok('status tidak valid -> 400', badFilter.status === 400, badFilter);

  const noAuth = await fetch(`${BASE}/debts`);
  ok('tanpa token -> 401', noAuth.status === 401);

  // ---------- Detail ----------
  console.log('\n=== Detail hutang ===');
  const detail = await req('GET', `/debts/${debtId}`);
  ok('GET /debts/:id -> 200', detail.status === 200, detail);
  ok('punya payments array', Array.isArray(detail.data?.data?.payments), detail.data);

  const detail404 = await req('GET', '/debts/00000000-0000-0000-0000-000000000000');
  ok('hutang tidak ada -> 404', detail404.status === 404, detail404);

  // ---------- Pembayaran ----------
  console.log('\n=== Pembayaran ===');
  const overpay = await req('POST', `/debts/${debtId}/payments`, { amount: 200000 });
  ok('bayar melebihi sisa -> 422', overpay.status === 422, overpay);

  const zero = await req('POST', `/debts/${debtId}/payments`, { amount: 0 });
  ok('bayar 0 -> 400 (validasi skema)', zero.status === 400, zero);

  const pay1 = await req('POST', `/debts/${debtId}/payments`, { amount: 40000, note: 'Bayar sebagian' });
  ok('bayar 40000 -> 201', pay1.status === 201, pay1);
  ok('paidAmount 40000', pay1.data?.data?.debt?.paidAmount === 40000, pay1.data);
  ok('status tetap belum_lunas', pay1.data?.data?.debt?.status === 'belum_lunas', pay1.data);
  ok('remaining 60000', pay1.data?.data?.debt?.remaining === 60000, pay1.data);

  const detailAfterPay = await req('GET', `/debts/${debtId}`);
  ok('riwayat pembayaran berisi 1', detailAfterPay.data?.data?.payments?.length === 1, detailAfterPay.data);
  ok(
    'catatan tersimpan',
    detailAfterPay.data?.data?.payments?.[0]?.note === 'Bayar sebagian',
    detailAfterPay.data?.data?.payments,
  );

  const pay2 = await req('POST', `/debts/${debtId}/payments`, { amount: 60000 });
  ok('bayar sisa 60000 -> 201', pay2.status === 201, pay2);
  ok('status jadi lunas', pay2.data?.data?.debt?.status === 'lunas', pay2.data);
  ok('remaining 0', pay2.data?.data?.debt?.remaining === 0, pay2.data);

  const payAfterLunas = await req('POST', `/debts/${debtId}/payments`, { amount: 1000 });
  ok('bayar hutang lunas -> 422', payAfterLunas.status === 422, payAfterLunas);

  // ---------- Ringkasan setelah lunas ----------
  console.log('\n=== Ringkasan setelah lunas ===');
  const after = await req('GET', '/debts');
  ok(
    'totalOutstanding turun ke 50000',
    after.data?.data?.summary?.totalOutstanding === 50000,
    after.data?.data?.summary,
  );
  ok(
    'overdueAmount turun ke 0',
    after.data?.data?.summary?.overdueAmount === 0,
    after.data?.data?.summary,
  );

  // ---------- Dashboard ----------
  console.log('\n=== Dashboard dueDebts ===');
  const dash = await req('GET', '/dashboard');
  ok('GET /dashboard -> 200', dash.status === 200, dash);
  ok('punya dueDebts', dash.data?.data?.dueDebts !== undefined, dash.data?.data);
  ok(
    'dueDebts.dueIn7DaysCount = 1',
    dash.data?.data?.dueDebts?.dueIn7DaysCount === 1,
    dash.data?.data?.dueDebts,
  );
  ok(
    'dueDebts.dueIn7DaysAmount = 50000',
    dash.data?.data?.dueDebts?.dueIn7DaysAmount === 50000,
    dash.data?.data?.dueDebts,
  );
  ok(
    'dueDebts.overdueCount = 0 (sudah lunas)',
    dash.data?.data?.dueDebts?.overdueCount === 0,
    dash.data?.data?.dueDebts,
  );

  // Catatan: data uji di atas dibersihkan lewat SQL terpisah setelah skrip selesai.

  console.log(`\nHASIL: ${pass} lulus, ${fail} gagal`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Skrip gagal:', error);
  process.exit(1);
});
