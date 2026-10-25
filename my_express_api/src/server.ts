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

/**
 * Percobaan menyambung database saat server menyala.
 *
 * Dulu hanya satu kali percobaan; kalau gagal, proses langsung keluar.
 * Masalahnya Postgres kelolaan seperti Neon menyalakan mesinnya DALAM DETIK,
 * jadi percobaan pertama saat mesinnya baru bangun sering berakhir
 * "Authentication timed out" atau "Connection terminated unexpectedly" —
 * padahal detik berikutnya semuanya normal. Karena itu dicoba berulang
 * dengan jeda yang makin panjang, bukan menyerah sekali.
 */
const JUMLAH_COBA = 6;
const JEDA_COBA_MS = [2_000, 4_000, 8_000, 15_000, 30_000, 30_000];

/** Jeda ping agar mesin database tidak dimatikan sendiri karena menganggur. */
const JEDA_PING_MS = 4 * 60 * 1000;

function pesanDari(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function tunggu(ms: number): Promise<void> {
  return new Promise((selesai) => setTimeout(selesai, ms));
}

async function sambungDatabase(): Promise<void> {
  for (let percobaan = 1; percobaan <= JUMLAH_COBA; percobaan += 1) {
    try {
      await sequelize.authenticate();
      console.log('Koneksi database berhasil.');

      // Buat tabel yang belum ada (skema ada di docs/03-database.md).
      await sequelize.sync();
      console.log('Sinkronisasi tabel selesai.');
      return;
    } catch (error) {
      const pesan = pesanDari(error);

      if (percobaan === JUMLAH_COBA) {
        throw new Error(
          `Gagal menyambung database setelah ${JUMLAH_COBA} percobaan. Penyebab terakhir: ${pesan}`,
        );
      }

      const jeda = JEDA_COBA_MS[percobaan - 1] ?? 30_000;
      console.warn(
        `Percobaan database ${percobaan}/${JUMLAH_COBA} gagal: ${pesan}. ` +
          `Mencoba lagi dalam ${jeda / 1000} detik...`,
      );
      await tunggu(jeda);
    }
  }
}

/**
 * Ping kecil tiap beberapa menit supaya mesin database tidak dimatikan
 * otomatis karena dianggap menganggur.
 *
 * Ping yang gagal HANYA dicatat — tidak menghentikan server. Saat mesin
 * database menyala kembali, ping berikutnya berhasil dan server pulih
 * sendiri tanpa perlu dijalankan ulang.
 */
function jagaDatabaseTetapBangun(): NodeJS.Timeout {
  let sebelumnyaGagal = false;

  return setInterval(() => {
    void sequelize
      .query('SELECT 1')
      .then(() => {
        if (sebelumnyaGagal) {
          console.log('[ping] Koneksi database pulih kembali.');
          sebelumnyaGagal = false;
        }
      })
      .catch((error: unknown) => {
        sebelumnyaGagal = true;
        console.warn(`[ping] Database belum bisa dihubungi: ${pesanDari(error)}`);
      });
  }, JEDA_PING_MS);
}

async function main(): Promise<void> {
  await sambungDatabase();

  if (env.keepDatabaseAwake) {
    jagaDatabaseTetapBangun();
    console.log(
      `Ping database aktif tiap ${JEDA_PING_MS / 60000} menit ` +
        '(matikan dengan KEEP_DATABASE_AWAKE=false di .env).',
    );
  } else {
    console.log('Ping database NONAKTIF (KEEP_DATABASE_AWAKE=false).');
  }

  // 0.0.0.0 agar bisa diakses dari HP lewat IP laptop, bukan hanya dari laptop.
  app.listen(env.port, '0.0.0.0', () => {
    console.log(
      `Server my_express berjalan di http://0.0.0.0:${env.port} (terbuka untuk semua interface)`,
    );
  });
}

main().catch((error: unknown) => {
  console.error('Server gagal dijalankan:', pesanDari(error));
  process.exit(1);
});
