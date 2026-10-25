/* Pastikan alamat backend yang AKAN dipakai aplikasi di HP benar-benar hidup.
 *
 * Jalankan: node scripts/check-bundle-url.cjs   (Metro harus sudah berjalan)
 *
 * Ada dua cara aplikasi menentukan alamat backend (lihat my_express/lib/api.ts,
 * fungsi resolveBaseUrl):
 *
 *   A. EXPO_PUBLIC_API_URL diisi  -> alamat dipakai apa adanya (desain lama).
 *      Risikonya: IP laptop bisa berubah tiap ganti Wi-Fi, dan bila .env lupa
 *      diperbarui aplikasi tetap terbuka tapi semua permintaan data gagal.
 *      Pemeriksaan: IP di .env HARUS ada di dalam bundel Metro; kalau tidak,
 *      berarti bundel belum dibangun ulang setelah .env diubah.
 *
 *   B. EXPO_PUBLIC_API_URL KOSONG  -> alamat diambil dari hostUri Metro
 *      (desain yang berlaku sekarang; .env sengaja dibiarkan kosong).
 *      Karena hostUri mengikuti alamat yang dipakai KLIEN (terbukti: tarik
 *      manifest lewat 10.13.186.32 menghasilkan hostUri 10.13.186.32:8082),
 *      IP laptop TIDAK perlu diganti lagi tiap pindah jaringan.
 *      Pemeriksaan yang relevan bukan "IP ada di bundel", melainkan:
 *        (1) hostUri dari manifest == alamat yang akan dipakai aplikasi,
 *        (2) backend benar-benar menjawab di alamat itu,
 *        (3) tidak ada alamat backend tertanam paksa di bundel.
 *
 * Kedua kasus keluar dengan kode 0 bila aman, 1 bila ada masalah — supaya
 * kegagalan berarti sesuatu, bukan sekadar "variabel kosong".
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const METRO_PORT = 8082;
const BACKEND_PORT = 3000;

/** Header yang sama dengan yang dikirim Expo Go saat meminta manifest. */
const MANIFEST_HEADERS = {
  'expo-platform': 'android',
  Accept: 'application/expo+json,application/json',
};

const BUNDLE_URL =
  `http://127.0.0.1:${METRO_PORT}/node_modules/expo-router/entry.bundle` +
  '?platform=android&dev=true&hot=false&minify=false';

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

/** Ambil host dari URL, mis. http://10.13.186.32:3000 -> 10.13.186.32 */
function hostOf(url) {
  if (!url) return null;
  const match = url.match(/^https?:\/\/([^/:]+)/);
  return match ? match[1] : null;
}

/** Semua IPv4 mesin ini yang bisa dijangkau HP (bukan loopback). */
function lanIPv4s() {
  const out = [];
  for (const [, infos] of Object.entries(os.networkInterfaces())) {
    for (const info of infos || []) {
      const isV4 = info.family === 'IPv4' || info.family === 4;
      if (isV4 && !info.internal) out.push(info.address);
    }
  }
  return out;
}

/**
 * Tarik manifest Metro memakai alamat tertentu dan baca hostUri-nya.
 * hostUri mengikuti alamat yang dipakai untuk meminta, jadi untuk mewakili
 * apa yang diterima HP, manifest harus ditarik lewat IP LAN — bukan loopback.
 */
async function readHostUri(baseUrl) {
  const res = await fetch(`${baseUrl}/`, {
    headers: MANIFEST_HEADERS,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`manifest membalas HTTP ${res.status}`);
  const json = await res.json();
  return json.extra?.expoClient?.hostUri ?? json.hostUri ?? null;
}

/** Semua host yang muncul sebagai alamat backend (:3000) di dalam bundel. */
function backendHostsIn(body) {
  const re = /http:\/\/(\d{1,3}(?:\.\d{1,3}){3}):(\d+)/g;
  const found = new Set();
  for (const m of body.matchAll(re)) {
    if (Number(m[2]) === BACKEND_PORT) found.add(m[1]);
  }
  return found;
}

async function fetchBundle() {
  const res = await fetch(BUNDLE_URL, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`Metro membalas ${res.status} ${res.statusText}`);
  return res.text();
}

function fail(lines) {
  console.log('');
  for (const line of [].concat(lines)) console.log(line);
  process.exit(1);
}

async function checkEnvFilled(expectedHost) {
  console.log(`EXPO_PUBLIC_API_URL terisi -> memakai IP ini: ${expectedHost}`);
  console.log('(desain lama: alamat dibaca langsung dari .env)\n');

  let body;
  try {
    body = await fetchBundle();
  } catch (e) {
    fail([`Gagal mengambil bundel: ${e.message}`, `Pastikan Metro berjalan: npx expo start --port ${METRO_PORT}`]);
  }

  console.log(`Ukuran bundel: ${(body.length / 1024 / 1024).toFixed(2)} MB`);

  const hosts = backendHostsIn(body);
  const found = hosts.has(expectedHost);
  console.log(`IP ${expectedHost} ada di bundel: ${found ? 'YA' : 'TIDAK'}`);

  if (!found) {
    fail([
      'HASIL: BUNDEL BELUM MEMAKAI IP TERKINI.',
      'Kemungkinan Metro belum dijalankan ulang setelah .env diubah.',
      `Jalankan: npx expo start --port ${METRO_PORT} --clear`,
    ]);
  }

  const stray = [...hosts].filter((h) => h !== expectedHost);
  if (stray.length) {
    console.log(`\nPERINGATAN: ada alamat backend lain di bundel: ${stray.join(', ')}`);
  }

  console.log('\nHASIL: BUNDEL MEMAKAI IP TERKINI');
}

async function checkEnvEmpty() {
  console.log('EXPO_PUBLIC_API_URL kosong -> desain auto-derive (lib/api.ts resolveBaseUrl)');
  console.log('Alamat diambil dari hostUri Metro, jadi ikut jaringan yang dipakai HP.\n');

  const ips = lanIPv4s();
  if (ips.length === 0) {
    fail(['Tidak menemukan IPv4 non-internal di mesin ini.', 'HP tidak mungkin terhubung lewat LAN.']);
  }
  console.log(`IPv4 mesin ini: ${ips.join(', ')}`);

  // [1] Manifest lewat IP LAN = alamat yang benar-benar diterima HP.
  console.log('\n[1] Manifest Metro (jalur yang dipakai HP)');
  let hostUri = null;
  let sourceIp = null;
  for (const ip of ips) {
    try {
      const value = await readHostUri(`http://${ip}:${METRO_PORT}`);
      console.log(`    http://${ip}:${METRO_PORT} -> hostUri = ${value ?? '(tidak ada)'}`);
      if (value) {
        hostUri = value;
        sourceIp = ip;
        break;
      }
    } catch (e) {
      console.log(`    http://${ip}:${METRO_PORT} -> gagal: ${e.message}`);
    }
  }
  if (!hostUri) {
    fail(['Metro tidak bisa dimintai manifest lewat IP mana pun.']);
  }

  const appHost = hostUri.split(':')[0];
  const backendUrl = `http://${appHost}:${BACKEND_PORT}`;
  console.log(`    => aplikasi akan memakai backend ${backendUrl}`);

  if (appHost === '127.0.0.1' || appHost === 'localhost') {
    fail([
      '',
      'MASALAH: hostUri menunjuk loopback.',
      `Aplikasi akan mencoba ${backendUrl} DI DALAM PONSEL sehingga semua permintaan pasti gagal.`,
      `Pastikan Metro dijalankan tanpa memaksa host loopback (pakai IP ${sourceIp}).`,
    ]);
  }

  // [2] Buktikan backend benar-benar menjawab di alamat itu.
  //     Status 401 pun dihitung sukses: yang diuji adalah jangkauan dan
  //     hidupnya server, bukan autentikasi (lihat verify-network.cjs untuk
  //     uji endpoint lengkap memakai akun sungguhan).
  console.log('\n[2] Backend menjawab di alamat itu');
  let status = 0;
  try {
    const res = await fetch(`${backendUrl}/api/products`, { signal: AbortSignal.timeout(8000) });
    status = res.status;
  } catch (e) {
    status = 0;
    console.log(`    GET ${backendUrl}/api/products -> gagal: ${e.message}`);
  }
  if (status !== 0) {
    const meaning = status === 401 ? ' (server hidup, meminta token — wajar)' : '';
    console.log(`    GET ${backendUrl}/api/products -> HTTP ${status}${meaning}`);
  }
  if (status === 0) {
    fail([
      '',
      `MASALAH: backend tidak terjangkau di ${backendUrl}.`,
      'Pastikan backend berjalan: npx tsx src/server.ts di my_express_api/',
    ]);
  }

  // [3] Tidak boleh ada alamat backend yang tertanam paksa di bundel.
  //     Karena .env kosong, bundel seharusnya sama sekali tidak memuat IP:3000.
  console.log('\n[3] Bundel Metro');
  let body;
  try {
    body = await fetchBundle();
  } catch (e) {
    fail([`Gagal mengambil bundel: ${e.message}`]);
  }
  console.log(`    ukuran: ${(body.length / 1024 / 1024).toFixed(2)} MB`);

  const hosts = backendHostsIn(body);
  if (hosts.size > 0) {
    fail([
      '',
      `MASALAH: ada alamat backend tertanam di bundel: ${[...hosts].join(', ')}`,
      'Padahal EXPO_PUBLIC_API_URL kosong, jadi tidak seharusnya ada IP:3000 sama sekali.',
      `Jalankan ulang Metro dengan cache bersih: npx expo start --port ${METRO_PORT} --clear`,
    ]);
  }
  console.log('    alamat backend tertanam: TIDAK ADA (seharusnya begitu)');

  console.log('\nHASIL: AMAN');
  console.log(`  Alamat yang akan dipakai HP : ${backendUrl}`);
  console.log(`  Diperoleh dari hostUri      : ${hostUri} (manifest via ${sourceIp})`);
  console.log('  Isi lengkap uji endpoint    : node scripts/verify-network.cjs');
}

async function main() {
  const value = readEnvValue('EXPO_PUBLIC_API_URL');
  if (value) {
    const expectedHost = hostOf(value);
    if (!expectedHost) {
      fail([`EXPO_PUBLIC_API_URL terisi tetapi bukan URL valid: ${value}`]);
    }
    await checkEnvFilled(expectedHost);
  } else {
    await checkEnvEmpty();
  }
}

main().catch((error) => {
  console.error('Gagal memeriksa:', error.message);
  console.error(`Pastikan Metro berjalan: npx expo start --port ${METRO_PORT}`);
  process.exit(1);
});
