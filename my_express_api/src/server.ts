import { app } from './app';
import { env } from './config/env';
import { sequelize } from './config/database';
import './models/User';
import './models/Product';
import './models/Transaction';
import './models/TransactionItem';
import './models/Distributor';
import './models/Debt';
import './models/DebtPayment';

async function main(): Promise<void> {
  // Tes koneksi database dulu sebelum menerima request.
  await sequelize.authenticate();
  console.log('Koneksi database berhasil.');

  // Buat tabel yang belum ada (skema ada di docs/03-database.md).
  await sequelize.sync();
  console.log('Sinkronisasi tabel selesai.');

  // 0.0.0.0 agar bisa diakses dari HP lewat IP laptop, bukan hanya dari laptop.
  app.listen(env.port, '0.0.0.0', () => {
    console.log(
      `Server my_express berjalan di http://0.0.0.0:${env.port} (terbuka untuk semua interface)`,
    );
  });
}

main().catch((error: unknown) => {
  console.error('Server gagal dijalankan:', error);
  process.exit(1);
});
