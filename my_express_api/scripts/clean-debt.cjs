/* Bersihkan data uji hutang. Jalankan: node scripts/clean-debt.cjs */
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

async function main() {
  await sequelize.authenticate();
  const [p] = await sequelize.query('DELETE FROM debt_payments');
  const [d] = await sequelize.query('DELETE FROM debts');
  const [r] = await sequelize.query(
    "DELETE FROM distributors WHERE name = 'CV Sumber ATK'",
  );
  const [[check]] = await sequelize.query(
    'SELECT (SELECT count(*) FROM debts) AS debts, (SELECT count(*) FROM distributors) AS distributors, (SELECT count(*) FROM debt_payments) AS payments',
  );
  console.log('Rows deleted -> debt_payments:', p.rowCount, '| debts:', d.rowCount, '| distributors:', r.rowCount);
  console.log('Sisa:', JSON.stringify(check));
  await sequelize.close();
}

main().catch((error) => {
  console.error('Gagal:', error.message);
  process.exit(1);
});
