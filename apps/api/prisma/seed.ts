import * as dotenv from 'dotenv';
import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const name = (process.env.ADMIN_NAME ?? 'Admin').trim();

  if (!email || !password) {
    console.log(
      'Skipping admin seed: set ADMIN_EMAIL and ADMIN_PASSWORD to create an admin account.',
    );
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== UserRole.ADMIN) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: UserRole.ADMIN },
      });
      console.log(`Updated existing user to ADMIN: ${email}`);
    } else {
      console.log(`Admin already exists: ${email}`);
    }
    return;
  }

  const passwordHash = await argon2.hash(password);

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  console.log(`Created admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
