/* Survei UI my_express: kumpulkan semua warna hex, jarak, dan ukuran huruf
   yang tertulis langsung di kode, untuk dasar rencana penataan tampilan.
   Jalankan: node scripts/survey-ui.cjs */
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

const files = [];
for (const d of DIRS) walk(path.join(ROOT, d), files);

/** Warna hex, dengan atau tanpa alpha. */
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
/** Warna dinamis RN yang sering dipakai. */
const NAMED = /\b(transparent|white|black|red|blue|green|gray|grey|orange|yellow|purple|pink)\b(?=\s*[,})])/g;

const colorFiles = new Map(); // warna -> Set(file)
const colorCount = new Map(); // warna -> jumlah kemunculan
const spacing = new Map();
const fontSizes = new Map();
const borderRadii = new Map();
let styleBlocks = 0;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  for (const m of text.match(HEX) || []) {
    const c = m.toLowerCase();
    colorCount.set(c, (colorCount.get(c) || 0) + 1);
    if (!colorFiles.has(c)) colorFiles.set(c, new Set());
    colorFiles.get(c).add(rel);
  }
  for (const m of text.match(NAMED) || []) {
    colorCount.set(m, (colorCount.get(m) || 0) + 1);
    if (!colorFiles.has(m)) colorFiles.set(m, new Set());
    colorFiles.get(m).add(rel);
  }

  styleBlocks += (text.match(/StyleSheet\.create/g) || []).length;

  for (const m of text.matchAll(/\b(?:gap|padding|paddingVertical|paddingHorizontal|margin|marginVertical|marginHorizontal|rowGap|columnGap)\s*:\s*(\d+)/g)) {
    const v = Number(m[1]);
    spacing.set(v, (spacing.get(v) || 0) + 1);
  }
  for (const m of text.matchAll(/\bfontSize\s*:\s*(\d+)/g)) {
    const v = Number(m[1]);
    fontSizes.set(v, (fontSizes.get(v) || 0) + 1);
  }
  for (const m of text.matchAll(/\bborderRadius\s*:\s*(\d+)/g)) {
    const v = Number(m[1]);
    borderRadii.set(v, (borderRadii.get(v) || 0) + 1);
  }
}

const sorted = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]);

console.log(`\nBerkas UI dianalisis : ${files.length}`);
console.log(`Blok StyleSheet      : ${styleBlocks}`);
console.log(`Warna BERBEDA       : ${colorCount.size}`);
console.log(`Ukuran huruf beda   : ${fontSizes.size}`);
console.log(`Jarak (gap/padding) : ${spacing.size} nilai berbeda`);
console.log(`Border radius beda  : ${borderRadii.size}`);

console.log(`\n--- SEMUA WARNA (warna | jumlah | jumlah file) ---`);
for (const [c, n] of sorted(colorCount)) {
  console.log(`${String(n).padStart(4)}  ${c.padEnd(10)} ${colorFiles.get(c).size} file`);
}

const singleUse = [...colorCount].filter(([, n]) => n === 1).length;
console.log(`\nWarna hanya dipakai SEKALI : ${singleUse} dari ${colorCount.size}`);
console.log(`Warna dipakai di >1 file   : ${[...colorFiles].filter(([, s]) => s.size > 1).length}`);

console.log(`\n--- UKURAN HURUF (nilai | kemunculan) ---`);
console.log(sorted(fontSizes).map(([v, n]) => `${v}:${n}`).join('  '));

console.log(`\n--- JARAK (nilai | kemunculan) ---`);
console.log(sorted(spacing).map(([v, n]) => `${v}:${n}`).join('  '));

console.log(`\n--- BORDER RADIUS (nilai | kemunculan) ---`);
console.log(sorted(borderRadii).map(([v, n]) => `${v}:${n}`).join('  '));
