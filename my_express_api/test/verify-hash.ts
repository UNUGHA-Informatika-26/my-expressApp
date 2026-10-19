// Script sekali pakai untuk verifikasi Fase 1:
// memastikan password di tabel users tersimpan ter-hash (bcrypt), bukan plaintext.
import { sequelize } from '../src/config/database';
import { User } from '../src/models/User';

async function main(): Promise<void> {
  const users = await User.scope('withPassword').findAll();
  for (const user of users) {
    const hash = user.passwordHash;
    const terHash = hash.startsWith('$2a$') || hash.startsWith('$2b$');
    console.log(`email=${user.email}`);
    console.log(`  awalan=${hash.slice(0, 7)}  panjang=${hash.length}  ter-hash-bcrypt=${terHash}`);
    console.log(`  plaintext-terlihat=${hash.includes('rahasia123')}`);
  }
  await sequelize.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
