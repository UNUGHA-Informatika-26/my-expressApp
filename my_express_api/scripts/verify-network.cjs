/* Verifikasi backend terhubung lewat IP jaringan (jalur yang dipakai HP).
   Jalankan: node scripts/verify-network.cjs

   Alamat dibaca dari EXPO_PUBLIC_API_URL di my_express/.env — sumber yang
   sama dengan yang dipakai aplikasi, sehingga keduanya tidak pernah beda. */
const fs = require('fs');
const path = require('path');

/** Ambil nilai satu variabel dari berkas .env sederhana. */
function readEnvValue(key) {
  const envPath = path.join(__dirname, '..', '..', 'my_express', '.env');
  try {
    const line = fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .find((row) => row.trim().startsWith(`${key}=`));
    return line ? line.slice(line.indexOf('=') + 1).trim() : null;
  } catch {
    return null;
  }
}

const BASE = `${readEnvValue('EXPO_PUBLIC_API_URL') || 'http://localhost:3000'}/api`;
const EMAIL = 'budi@tokokita.com';
const PASSWORD = 'rahasia123';

async function main() {
  console.log(`Backend: ${BASE}\n`);

  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginBody = await login.json();

  if (login.status !== 200) {
    console.log(`LOGIN GAGAL -> ${login.status}`, JSON.stringify(loginBody));
    process.exit(1);
  }

  const token = loginBody.data.token;
  console.log(`Login            -> ${login.status} OK (token ${token.slice(0, 18)}...)`);

  const auth = { Authorization: `Bearer ${token}` };

  const [products, debts, dashboard, history] = await Promise.all([
    fetch(`${BASE}/products`, { headers: auth }),
    fetch(`${BASE}/debts`, { headers: auth }),
    fetch(`${BASE}/dashboard`, { headers: auth }),
    fetch(`${BASE}/transactions`, { headers: auth }),
  ]);

  console.log(`GET /products    -> ${products.status}`);
  console.log(`GET /debts       -> ${debts.status}  (Fase 7)`);
  console.log(`GET /dashboard   -> ${dashboard.status}`);
  console.log(`GET /transactions-> ${history.status}`);

  const dash = await dashboard.json();
  const deb = await debts.json();

  console.log(`\ndueDebts         -> ${JSON.stringify(dash.data?.dueDebts)}`);
  console.log(`debts summary    -> ${JSON.stringify(deb.data?.summary)}`);
  console.log(`debts items      -> ${deb.data?.items?.length ?? '???'} tagihan`);

  const allOk = [products, debts, dashboard, history].every((r) => r.status === 200);
  console.log(`\nHASIL: ${allOk ? 'SEMUA ENDPOINT TERJANGKAU LEWAT IP JARINGAN' : 'ADA YANG GAGAL'}`);
  process.exit(allOk ? 0 : 1);
}

main().catch((error) => {
  console.error('Gagal terhubung:', error.message);
  console.error('\nPastikan backend berjalan: npm run dev di my_express_api/');
  process.exit(1);
});
