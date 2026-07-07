import { PrismaClient } from '@prisma/client';

const NEON_URL = 'postgresql://neondb_owner:npg_IgKsQi54qphJ@ep-holy-wind-aoj7xyto-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const prisma = new PrismaClient({
  datasources: { db: { url: NEON_URL } },
});

async function main() {
  const parent = await prisma.product.findFirst({ where: { name: { contains: '日本' }, parentId: null } });
  if (!parent) { console.log('No Japanese parent product found'); return; }
  
  console.log(`Parent: ${parent.name} (${parent.nameEn}) - Status: ${parent.status}`);
  
  const children = await prisma.product.findMany({
    where: { parentId: parent.id },
    orderBy: { name: 'asc' },
    select: { name: true, nameEn: true, status: true, priceMin: true, priceMax: true, commissionRate: true, commissionFixed: true },
  });
  
  console.log(`Total sub-products: ${children.length}`);
  console.log('---');
  
  for (const c of children) {
    const price = c.priceMin === c.priceMax ? `HK$${c.priceMin?.toLocaleString()}` : `HK$${c.priceMin?.toLocaleString()} - ${c.priceMax?.toLocaleString()}`;
    let comm = '-';
    if (c.commissionFixed > 0) comm = `HK$${c.commissionFixed.toLocaleString()}`;
    else if (c.commissionRate > 0) comm = `${c.commissionRate}%`;
    console.log(`  ${c.name} | ${price} | ${comm} | ${c.status}`);
  }
  
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
