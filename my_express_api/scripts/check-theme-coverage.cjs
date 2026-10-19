/* Pastikan setiap warna yang dipakai layar punya token di lib/theme.ts.
 *
 * Jalankan: node scripts/check-theme-coverage.cjs
 *
 * Dua pemeriksaan:
 *   1. WARNA HILANG — hex di layar yang tidak ada di theme.ts (harus 0).
 *      Ini yang mencegah ada warna "sembunyi" yang lupa diberi token.
 *   2. TOKEN TAK TERPAKAI — token di theme.ts yang belum dipakai layar mana pun.
 *      Bukan kesalahan (mungkin dipakai tahap berikutnya), hanya catatan.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', 'my_express');
const DIRS = ['app', 'components', 'features'];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

// --- 1. Kumpulkan warna dari theme.ts ---
const themePath = path.join(ROOT, 'lib', 'theme.ts');
const themeText = fs.readFileSync(themePath, 'utf8');
const themeColors = new Set((themeText.match(HEX) || []).map((h) => h.toLowerCase()));

// --- 2. Kumpulkan warna dari semua berkas layar ---
const files = [];
for (const d of DIRS) walk(path.join(ROOT, d), files);

const missing = new Map(); // warna -> Set(file)
const usedThemeColors = new Set();

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  for (const m of text.match(HEX) || []) {
    const c = m.toLowerCase();
    if (themeColors.has(c)) {
      usedThemeColors.add(c);
    } else {
      if (!missing.has(c)) missing.set(c, new Set());
      missing.get(c).add(rel);
    }
  }
}

console.log(`Tema berisi      : ${themeColors.size} warna`);
console.log(`Berkas layar    : ${files.length}`);
console.log(`Warna dipakai   : ${usedThemeColors.size} token terpakai\n`);

if (missing.size > 0) {
  console.log('--- WARNA DI LAYAR TANPA TOKEN (wajib dibereskan) ---');
  for (const [c, set] of [...missing].sort()) {
    console.log(`  ${c}  ->  ${[...set].join(', ')}`);
  }
} else {
  console.log('WARNA HILANG: 0 — semua warna layar punya token.');
}

const unused = [...themeColors].filter((c) => !usedThemeColors.has(c));
if (unused.length > 0) {
  console.log(`\n--- TOKEN BELUM TERPAKAI (catatan, bukan kesalahan) ---`);
  console.log(`  ${unused.join(', ')}`);
}

process.exitCode = missing.size > 0 ? 1 : 0;
