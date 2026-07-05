/**
 * Seed script for Neon PostgreSQL
 * Usage: DATABASE_URL="postgresql://..." npx tsx scripts/seed-neon.ts
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Neon PostgreSQL database...');

  // Hash password (all users use demo123)
  const pwd = await hash('demo123', 10);

  // Seed Users
  const users = [
    { id: 'user-admin-001', email: 'admin@mclub.com', name: 'MCLUB Admin', password: pwd, role: 'admin' },
    { id: 'user-chan-001', email: 'chan@mypath.hk', name: '陳志明', password: pwd, role: 'director' },
    { id: 'user-lee-001', email: 'lee@mypath.hk', name: '李美琪', password: pwd, role: 'director' },
    { id: 'user-wong-001', email: 'wong@mypath.hk', name: '黃偉業', password: pwd, role: 'director' },
    { id: 'user-bosco-001', email: 'bosco@mclub.com', name: 'Bosco', password: pwd, role: 'director' },
    { id: 'user-damon-001', email: 'damon@mclub.com', name: 'Damon Lewis', password: pwd, role: 'director' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    console.log('  User:', u.email, '(' + u.role + ')');
  }

  // Seed Products
  const products = [
    { id: 'prod-jp-001', name: '日本物業投資', nameEn: 'Japan Property Investment', emoji: '🏘️', description: '為客戶提供日本優質物業投資機會，涵蓋東京、大阪等主要城市住宅及商業物業。', descriptionEn: 'Premium Japanese property investment opportunities in Tokyo, Osaka.', category: 'investment', priceMin: 3245000, priceMax: 3520000, currency: 'HKD' },
    { id: 'prod-stp-001', name: '聖多美公民計劃/日本高度人才套裝', nameEn: 'STP Citizenship / Japan HSP Package', emoji: '🇸🇹', description: '聖多美及普林西比投資入籍計劃，快速審批、免簽多國。', descriptionEn: 'São Tomé and Príncipe investment citizenship program.', category: 'immigration', priceMin: 30000, priceMax: 1000000, currency: 'HKD' },
    { id: 'prod-npc-001', name: 'NPC基金', nameEn: 'NPC Fund', emoji: '📈', description: 'NPC基金專注於新興市場及另類投資。', descriptionEn: 'NPC Fund focuses on emerging markets and alternative investments.', category: 'fund', priceMin: 100000, priceMax: 1560000, currency: 'HKD' },
    { id: 'prod-trust-001', name: '家族信託', nameEn: 'Family Trust', emoji: '🏛️', description: '專業家族信託服務，助您規劃資產傳承。', descriptionEn: 'Professional family trust services for wealth succession planning.', category: 'trust', priceMin: 50000, priceMax: 500000, currency: 'HKD' },
    { id: 'prod-corp-001', name: '海外公司註冊', nameEn: 'Overseas Company Registration', emoji: '🏢', description: '提供全球多個司法管轄區嘅公司註冊服務。', descriptionEn: 'Company registration services across multiple jurisdictions.', category: 'corporate', priceMin: 5000, priceMax: 80000, currency: 'HKD' },
    { id: 'prod-tech-001', name: 'AI 技術方案', nameEn: 'AI Technology Solutions', emoji: '🤖', description: '為企業提供人工智能技術諮詢同解決方案。', descriptionEn: 'AI consulting and solutions for businesses.', category: 'technology', priceMin: 20000, priceMax: 200000, currency: 'HKD' },
    { id: 'prod-legal-001', name: '法律顧問服務', nameEn: 'Legal Advisory Services', emoji: '⚖️', description: '專業法律團隊提供全方位法律顧問服務。', descriptionEn: 'Professional legal advisory services.', category: 'legal', priceMin: 10000, priceMax: 100000, currency: 'HKD' },
    { id: 'prod-edu-001', name: '海外教育規劃', nameEn: 'Overseas Education Planning', emoji: '🎓', description: '為學生提供海外升學規劃同申請服務。', descriptionEn: 'Overseas education planning and application services.', category: 'education', priceMin: 15000, priceMax: 300000, currency: 'HKD' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
    console.log('  Product:', p.name);
  }

  // Seed a sample event
  await prisma.event.upsert({
    where: { id: 'event-001' },
    update: {},
    create: {
      id: 'event-001',
      title: 'MCLUB 2026 年度投資展望研討會',
      type: 'seminar',
      date: new Date('2026-08-15T14:00:00.000Z'),
      location: '香港中環國際金融中心',
      maxAttendees: 100,
      status: 'upcoming',
    },
  });
  console.log('  Event: MCLUB 2026 年度投資展望研討會');

  // Seed a sample notice
  await prisma.notice.upsert({
    where: { id: 'notice-001' },
    update: {},
    create: {
      id: 'notice-001',
      title: '歡迎使用 MCLUB CRM',
      content: 'MCLUB 會員俱樂部客戶關係管理系統已正式啟用。請各 Director 積極使用系統管理客戶資料及跟進訂單。',
      category: 'announcement',
      targetRoles: 'admin,director',
      authorId: 'user-admin-001',
    },
  });
  console.log('  Notice: 歡迎使用 MCLUB CRM');

  // Verify
  const userCount = await prisma.user.count();
  const prodCount = await prisma.product.count();
  console.log(`\nDone! Users: ${userCount}, Products: ${prodCount}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});