// Script sekali pakai: menghapus data uji Fase 1
// agar sesi berikutnya mulai dengan database bersih.
import { sequelize } from '../src/config/database';
import { User } from '../src/models/User';

const EMAIL_UJI = ['ucek@tokokita.com', 'budi@tokokita.com'];

async function main(): Promise<void> {
  const deleted = await User.scope('withPassword').destroy({
    where: { email: EMAIL_UJI },
  });
  console.log(`Data uji dihapus: ${deleted} baris`);
  await sequelize.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
