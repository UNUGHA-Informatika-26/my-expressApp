/* Bersihkan data uji Fase 9: hapus dua akun khas uji beserta SELURUH isinya.
 *
 * Jalankan: node scripts/clean-phase9.cjs
 *
 * Berbeda dengan Fase 8 (dibersihkan lewat prefix barcode), uji Fase 9 memakai
 * akun sendiri. Transaksi dan pembayaran hutang tidak punya endpoint hapus,
 * jadi akun ujinya beserta isinya dihapus langsung dari database.
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

// Klausa pemilih baris milik akun uji.
const OWNED = `user_id IN (SELECT id FROM users WHERE email IN ('uji-fase9@tokokita.com', 'uji-fase9b@tokokita.com'))`;

async function main() {
  await sequelize.authenticate();

  // Urutan mengikuti kunci asing: anak dulu, lalu induk.
  // PostgreSQL mengembalikan jumlah baris terhapus di elemen kedua hasil query.
  const steps = [
    [
      'transaction_items',
      `DELETE FROM transaction_items WHERE transaction_id IN (SELECT id FROM transactions WHERE ${OWNED})`,
    ],
    ['transactions', `DELETE FROM transactions WHERE ${OWNED}`],
    ['products', `DELETE FROM products WHERE ${OWNED}`],
    ['debt_payments', `DELETE FROM debt_payments WHERE debt_id IN (SELECT id FROM debts WHERE ${OWNED})`],
    ['debts', `DELETE FROM debts WHERE ${OWNED}`],
    ['distributors', `DELETE FROM distributors WHERE ${OWNED}`],
    ['users', `DELETE FROM users WHERE email IN ('uji-fase9@tokokita.com', 'uji-fase9b@tokokita.com')`],
  ];

  const deleted = {};
  for (const [name, sql] of steps) {
    const [, meta] = await sequelize.query(sql);
    deleted[name] = meta?.rowCount ?? 0;
  }

  const [[check]] = await sequelize.query(
    `SELECT
       (SELECT count(*) FROM users WHERE email LIKE 'uji-fase9%') AS test_users,
       (SELECT count(*) FROM products WHERE barcode LIKE 'TEST9-%') AS test_products,
       (SELECT count(*) FROM debts WHERE invoice_number LIKE 'INV-9-%') AS test_debts,
       (SELECT count(*) FROM products) AS products,
       (SELECT count(*) FROM transactions) AS transactions,
       (SELECT count(*) FROM debts) AS debts,
       (SELECT count(*) FROM users) AS users`,
  );

  console.log('Dihapus ->', Object.entries(deleted).map(([k, v]) => `${k}: ${v}`).join(' | '));
  console.log('Sisa:', JSON.stringify(check));

  await sequelize.close();
}

main().catch((error) => {
  console.error('Gagal:', error.message);
  process.exit(1);
});
