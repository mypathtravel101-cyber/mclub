const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

const USERS = [
  { email: 'admin@mclub.com', name: 'MCLUB Admin', role: 'admin', password: 'admin123' },
  { email: 'chan@mypath.hk', name: '陳志明', role: 'director', password: 'director123' },
  { email: 'lee@mypath.hk', name: '李美琪', role: 'director', password: 'director123' },
  { email: 'wong@mypath.hk', name: '黃偉業', role: 'director', password: 'director123' },
  { email: 'bosco@mclub.com', name: 'Bosco', role: 'director', password: 'demo123' },
  { email: 'damon@mclub.com', name: 'Damon Lewis', role: 'director', password: 'demo123' },
];

async function main() {
  console.log('Seeding users...');

  for (const u of USERS) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashedPassword },
      create: { email: u.email, name: u.name, role: u.role, password: hashedPassword },
    });
    console.log(`  Created/updated user: ${u.email}`);
  }

  console.log('Done! Users seeded successfully.');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());