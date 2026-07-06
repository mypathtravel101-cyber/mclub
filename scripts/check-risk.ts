import { PrismaClient } from '@prisma/client';

const NEON_URL = 'postgresql://neondb_owner:npg_IgKsQi54qphJ@ep-holy-wind-aoj7xyto-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const prisma = new PrismaClient({
  datasources: { db: { url: NEON_URL } },
});

async function main() {
  // Find all parent products
  const parents = await prisma.product.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, nameEn: true, status: true, emoji: true },
  });
  
  console.log('=== All 11 Parent Products ===');
  for (const p of parents) {
    const childCount = await prisma.product.count({ where: { parentId: p.id } });
    console.log(`  ${p.emoji} ${p.name} (${p.nameEn}) | ${childCount} 子產品 | ${p.status}`);
  }

  // Find 日本物業風險評估 specifically
  const risk = await prisma.product.findFirst({ where: { name: { contains: '風險評估' } } });
  console.log('\n=== 日本物業風險評估 ===');
  if (!risk) {
    console.log('NOT FOUND in Neon database');
  } else {
    console.log(`Found: ${risk.name} (${risk.nameEn})`);
    console.log(`Status: ${risk.status}`);
    console.log(`ParentId: ${risk.parentId}`);
    
    if (risk.parentId) {
      const parent = await prisma.product.findUnique({ where: { id: risk.parentId }, select: { name: true } });
      console.log(`Parent: ${parent?.name}`);
    }
    
    const children = await prisma.product.findMany({
      where: { parentId: risk.id },
      select: { name: true, nameEn: true, status: true },
    });
    console.log(`Sub-products: ${children.length}`);
    for (const c of children) {
      console.log(`  - ${c.name} (${c.nameEn}) | ${c.status}`);
    }
  }
  
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
