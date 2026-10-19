/* Bersihkan data uji Fase 8. Jalankan: node scripts/clean-phase8.cjs */
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

async function main() {
  await sequelize.authenticate();

  // Produk uji dikenali dari barcode berprefix TEST8-.
  // Untuk DELETE, PostgreSQL mengembalikan barisnya di elemen kedua.
  const [products, productsMeta] = await sequelize.query(
    "DELETE FROM products WHERE barcode LIKE 'TEST8-%'",
  );

  // Hutang dan pembayarannya dihapus dulu sebelum distributor (FK).
  const [payments, paymentsMeta] = await sequelize.query(
    "DELETE FROM debt_payments WHERE debt_id IN (SELECT id FROM debts WHERE invoice_number LIKE 'INV-F8-%')",
  );
  const [debts, debtsMeta] = await sequelize.query(
    "DELETE FROM debts WHERE invoice_number LIKE 'INV-F8-%'",
  );
  const [distributors, distributorsMeta] = await sequelize.query(
    "DELETE FROM distributors WHERE name = 'CV Uji Fase 8'",
  );

  const [[check]] = await sequelize.query(
    `SELECT
       (SELECT count(*) FROM products WHERE barcode LIKE 'TEST8-%') AS test_products,
       (SELECT count(*) FROM debts WHERE invoice_number LIKE 'INV-F8-%') AS test_debts,
       (SELECT count(*) FROM distributors WHERE name = 'CV Uji Fase 8') AS test_distributors,
       (SELECT count(*) FROM products) AS products,
       (SELECT count(*) FROM debts) AS debts`,
  );

  console.log(
    'Dihapus -> products:', productsMeta?.rowCount ?? products?.length ?? 0,
    '| debt_payments:', paymentsMeta?.rowCount ?? payments?.length ?? 0,
    '| debts:', debtsMeta?.rowCount ?? debts?.length ?? 0,
    '| distributors:', distributorsMeta?.rowCount ?? distributors?.length ?? 0,
  );
  console.log('Sisa:', JSON.stringify(check));

  await sequelize.close();
}

main().catch((error) => {
  console.error('Gagal:', error.message);
  process.exit(1);
});
