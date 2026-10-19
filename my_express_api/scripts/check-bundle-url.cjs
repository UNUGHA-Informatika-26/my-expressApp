/* Pastikan EXPO_PUBLIC_API_URL yang tertanam di bundel Metro memakai IP terkini.
 *
 * Jalankan: node scripts/check-bundle-url.cjs   (Metro harus sudah berjalan)
 *
 * Masalah yang dicegah: `.env` menyimpan IP laptop yang BISA BERUBAH tiap
 * ganti Wi-Fi. Kalau IP lama masih tertanam, aplikasi di HP tampak terbuka
 * (Metro terhubung) tetapi semua permintaan data gagal karena menunjuk alamat
 * yang sudah tidak ada. Metro membaca .env saat startup, jadi setelah mengubah
 * .env Metro wajib dijalankan ulang.
 */
const fs = require('fs');
const path = require('path');

const METRO_PORT = 8082;

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

const expectedHost = hostOf(readEnvValue('EXPO_PUBLIC_API_URL'));
if (!expectedHost) {
  console.log('EXPO_PUBLIC_API_URL tidak ditemukan di my_express/.env');
  process.exit(1);
}

const bundleUrl =
  `http://127.0.0.1:${METRO_PORT}/node_modules/expo-router/entry.bundle` +
  '?platform=android&dev=true&hot=false&minify=false';

async function main() {
  console.log(`Host yang diharapkan: ${expectedHost}\n`);

  const response = await fetch(bundleUrl);
  if (!response.ok) {
    throw new Error(`Metro membalas ${response.status} ${response.statusText}`);
  }
  const body = await response.text();
  console.log(`Ukuran bundel: ${(body.length / 1024 / 1024).toFixed(2)} MB`);

  const count = (needle) => body.split(needle).length - 1;
  const found = count(expectedHost);
  console.log(`IP ${expectedHost} ada di bundel: ${found} kali`);

  if (found === 0) {
    console.log('\nHASIL: BUNDEL BELUM MEMAKAI IP TERKINI.');
    console.log(`Kemungkinan Metro belum dijalankan ulang setelah .env diubah.`);
    console.log(`Jalankan: npx expo start --port ${METRO_PORT} --clear`);
    process.exit(1);
  }

  // Cari sisa IP lama agar ketahuan bila .env lupa diperbarui.
  // Alamat loopback dibuang: 127.0.0.1 milik dev server Metro, bukan URL API.
  const hosts = new Set(
    [...body.matchAll(/http:\/\/(\d{1,3}(?:\.\d{1,3}){3}):\d+/g)].map((m) => m[1]),
  );
  hosts.delete(expectedHost);
  hosts.delete('127.0.0.1');
  hosts.delete('0.0.0.0');

  if (hosts.size > 0) {
    console.log(`\nPERINGATAN: ada alamat IP lain di bundel: ${[...hosts].join(', ')}`);
  }

  console.log('\nHASIL: BUNDEL MEMAKAI IP TERKINI');
}

main().catch((error) => {
  console.error('Gagal memeriksa bundel:', error.message);
  console.error(`Pastikan Metro berjalan: npx expo start --port ${METRO_PORT}`);
  process.exit(1);
});
