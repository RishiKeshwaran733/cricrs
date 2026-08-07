/**
 * Database seed — creates the default admin user.
 * Run: npm run seed
 */
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminEmail = 'admin@cricrs.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'CricRS Admin',
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created: admin@cricrs.com / Admin@123');
  } else {
    console.log('ℹ️  Admin user already exists.');
  }

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
