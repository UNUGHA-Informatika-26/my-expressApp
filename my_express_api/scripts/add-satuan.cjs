/*
 * Tambah kolom `satuan` ke tabel yang sudah ada.
 * Jalankan: node scripts/add-satuan.cjs
 *
 * Kenapa perlu skrip ini: sequelize.sync() hanya MEMBUAT tabel baru, ia tidak
 * menambah kolom ke tabel yang sudah ada. Jadi di database lokal yang sudah
 * berisi data, kolomnya harus ditambahkan lewat ALTER TABLE sekali jalan.
 *
 * Database baru (mis. server online yang dimulai dari nol) tidak memerlukan
 * skrip ini — sync() membuat kolomnya sejak awal.
 *
 * Aman dijalankan berkali-kali: bila kolom sudah ada, tabel itu dilewati.
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

/** Tabel yang memerlukan kolom `satuan`, beserta kolom penanda barisnya. */
const TABEL = [
  { nama: 'products', penanda: 'produk' },
  { nama: 'transaction_items', penanda: 'item' },
];

async function cekKolom(tabel) {
  const [[row]] = await sequelize.query(
    `SELECT column_name, data_type, character_maximum_length, column_default
       FROM information_schema.columns
      WHERE table_name = :tabel AND column_name = 'satuan'`,
    { replacements: { tabel } },
  );
  return row ?? null;
}

async function tambahKolom({ nama, penanda }) {
  const ada = await cekKolom(nama);
  if (ada) {
    console.log(`[${nama}] kolom \`satuan\` sudah ada — dilewati.`);
    return;
  }

  // Data lama diisi 'pcs' supaya tidak menyisakan nilai kosong.
  // Sesuai docs/03-database.md: satuan VARCHAR(20) wajib, default 'pcs'.
  await sequelize.query(
    `ALTER TABLE ${nama} ADD COLUMN satuan VARCHAR(20) NOT NULL DEFAULT 'pcs'`,
  );

  const [[after]] = await sequelize.query(
    `SELECT count(*) AS jumlah, count(*) FILTER (WHERE satuan = 'pcs') AS memakai_pcs
       FROM ${nama}`,
  );
  console.log(
    `[${nama}] kolom \`satuan\` ditambahkan. ${penanda} terdampak: ${after.jumlah}` +
      ` | otomatis diisi "pcs": ${after.memakai_pcs}`,
  );
}

async function main() {
  await sequelize.authenticate();
  for (const tabel of TABEL) {
    await tambahKolom(tabel);
  }
  await sequelize.close();
}

main().catch((error) => {
  console.error('Gagal:', error.message);
  process.exit(1);
});
