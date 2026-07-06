/**
 * Add sub-products to existing parent products in Neon
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUB_PRODUCTS: Record<string, Array<{
  name: string; nameEn: string; emoji: string; description: string; descriptionEn: string;
  category: string; priceMin: number; priceMax: number; currency: string;
  commissionRate: number; commissionFixed: number; commissionNegotiable?: boolean; status: string;
  attachmentUrl?: string;
}>> = {
  '日本物業投資': [
    { name: '栖云8区画 A', nameEn: 'Seiun 8 Kukaku A', emoji: '🏘️', description: '栖云8区画 A型日本物業投資項目，位於優質地段，提供穩定租金回報及資本增值潛力。', descriptionEn: 'Seiun 8 Kukaku Type A property investment in premium location.', category: 'investment', priceMin: 3520000, priceMax: 3520000, currency: 'HKD', commissionRate: 0, commissionFixed: 112128, status: 'active' },
    { name: '栖云8区画 B', nameEn: 'Seiun 8 Kukaku B', emoji: '🏘️', description: '栖云8区画 B型日本物業投資項目，適合中型投資者。', descriptionEn: 'Seiun 8 Kukaku Type B property investment for mid-scale investors.', category: 'investment', priceMin: 3245000, priceMax: 3245000, currency: 'HKD', commissionRate: 0, commissionFixed: 103368, status: 'active' },
    { name: '栖云8区画 C1', nameEn: 'Seiun 8 Kukaku C1', emoji: '🏘️', description: '栖云8区画 C1型高端日本物業投資項目。', descriptionEn: 'Seiun 8 Kukaku C1 premium property investment.', category: 'investment', priceMin: 3355000, priceMax: 3355000, currency: 'HKD', commissionRate: 0, commissionFixed: 106872, status: 'active' },
    { name: '栖云8区画 C2', nameEn: 'Seiun 8 Kukaku C2', emoji: '🏘️', description: '栖云8区画 C2型高端日本物業投資項目。', descriptionEn: 'Seiun 8 Kukaku C2 premium property investment.', category: 'investment', priceMin: 3355000, priceMax: 3355000, currency: 'HKD', commissionRate: 0, commissionFixed: 106872, status: 'active' },
    { name: '栖云8区画 C3', nameEn: 'Seiun 8 Kukaku C3', emoji: '🏘️', description: '栖云8区画 C3型高端日本物業投資項目。', descriptionEn: 'Seiun 8 Kukaku C3 premium property investment.', category: 'investment', priceMin: 3355000, priceMax: 3355000, currency: 'HKD', commissionRate: 0, commissionFixed: 106872, status: 'active' },
    { name: '栖云8区画 C4', nameEn: 'Seiun 8 Kukaku C4', emoji: '🏘️', description: '栖云8区画 C4型高端日本物業投資項目。', descriptionEn: 'Seiun 8 Kukaku C4 premium property investment.', category: 'investment', priceMin: 3272500, priceMax: 3272500, currency: 'HKD', commissionRate: 0, commissionFixed: 104244, status: 'active' },
    { name: '栖云8区画 C5', nameEn: 'Seiun 8 Kukaku C5', emoji: '🏘️', description: '栖云8区画 C5型頂級日本物業投資項目。', descriptionEn: 'Seiun 8 Kukaku C5 top-tier property investment.', category: 'investment', priceMin: 3410000, priceMax: 3410000, currency: 'HKD', commissionRate: 0, commissionFixed: 108624, status: 'active' },
  ],
  'NPC基金': [
    { name: 'NPC基金投資方案', nameEn: 'NPC Fund Investment Plan', emoji: '📈', description: 'NPC基金投資方案，提供靈活投資額度。', descriptionEn: 'NPC Fund investment plan with flexible amounts.', category: 'fund', priceMin: 100000, priceMax: 1560000, currency: 'HKD', commissionRate: 8.0, commissionFixed: 0, attachmentUrl: '/attachments/npc_fund_presentation.pdf', status: 'active' },
  ],
  '公司秘書服務': [
    { name: 'Damon Lewis 公司秘書服務', nameEn: 'Damon Lewis Company Secretary Service', emoji: '📋', description: 'Damon Lewis 專業公司秘書服務。', descriptionEn: 'Damon Lewis professional company secretary service.', category: 'corporate', priceMin: 6000, priceMax: 6000, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
    { name: 'Damon Lewis 會計及稅務', nameEn: 'Damon Lewis Accounting & Tax', emoji: '📋', description: 'Damon Lewis 會計及稅務服務。', descriptionEn: 'Damon Lewis accounting and tax services.', category: 'corporate', priceMin: 45000, priceMax: 45000, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
    { name: 'Damon Lewis 公司成立與合規', nameEn: 'Damon Lewis Company Formation & Compliance', emoji: '📋', description: 'Damon Lewis 公司成立與合規服務。', descriptionEn: 'Damon Lewis company formation and compliance.', category: 'corporate', priceMin: 8800, priceMax: 8800, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
    { name: 'Damon Lewis 中小企融資顧問', nameEn: 'Damon Lewis SME Financing Advisory', emoji: '📋', description: 'Damon Lewis 中小企融資顧問服務。', descriptionEn: 'Damon Lewis SME financing advisory.', category: 'corporate', priceMin: 20000, priceMax: 20000, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
    { name: 'Damon Lewis BUD專項基金申請', nameEn: 'Damon Lewis BUD Fund Application', emoji: '📋', description: 'Damon Lewis BUD專項基金申請服務。', descriptionEn: 'Damon Lewis BUD Fund application service.', category: 'corporate', priceMin: 20000, priceMax: 20000, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
    { name: 'Damon Lewis 貸款服務', nameEn: 'Damon Lewis Loan Services', emoji: '📋', description: 'Damon Lewis 貸款服務。', descriptionEn: 'Damon Lewis loan services.', category: 'corporate', priceMin: 0, priceMax: 0, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
    { name: 'Damon Lewis Plan D.2 (公司秘書+會計稅務+公司成立)', nameEn: 'Damon Lewis Plan D.2 (Secretary+Accounting+Formation)', emoji: '📋', description: 'Damon Lewis Plan D.2 套裝。', descriptionEn: 'Damon Lewis Plan D.2 package.', category: 'corporate', priceMin: 29800, priceMax: 29800, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
    { name: 'Damon Lewis Plan D.3 (公司秘書+公司成立+融資顧問+BUD基金)', nameEn: 'Damon Lewis Plan D.3 (Secretary+Formation+Financing+BUD)', emoji: '📋', description: 'Damon Lewis Plan D.3 套裝。', descriptionEn: 'Damon Lewis Plan D.3 package.', category: 'corporate', priceMin: 39998, priceMax: 39998, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
  ],
  '家族信託': [
    { name: '設立香港家族信託', nameEn: 'Set Up Hong Kong Family Trust', emoji: '🏦', description: '設立香港家族信託架構，實現資產保護、財富傳承及稅務優化。', descriptionEn: 'Set up Hong Kong family trust for asset protection and wealth succession.', category: 'trust', priceMin: 4500000, priceMax: 4500000, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
  ],
  '聖多美公民計劃/日本高度人才套裝': [
    { name: '聖多美公民身份', nameEn: 'STP Citizenship', emoji: '🇸🇹', description: '聖多美及普林西比投資入籍計劃，非CRS管轄區，4代覆蓋。', descriptionEn: 'STP investment citizenship, non-CRS, 4-generation coverage.', category: 'immigration', priceMin: 1000000, priceMax: 1000000, currency: 'HKD', commissionRate: 0, commissionFixed: 60000, status: 'active' },
    { name: '日本經營管理者簽/首次設定', nameEn: 'STP Japan Business Manager Visa Setup', emoji: '🇯🇵', description: '聖多美公民申請日本經營管理者簽證首次設定全套服務。', descriptionEn: 'Full setup for STP citizens applying for Japan Business Manager visa.', category: 'immigration', priceMin: 150000, priceMax: 150000, currency: 'HKD', commissionRate: 0, commissionFixed: 40000, status: 'active' },
    { name: '經營管理者續簽', nameEn: 'STP Business Manager Visa Renewal', emoji: '🇯🇵', description: '日本經營管理者簽證續期及年度管理套裝。', descriptionEn: 'Japan Business Manager visa renewal and annual management.', category: 'immigration', priceMin: 30000, priceMax: 30000, currency: 'HKD', commissionRate: 0, commissionFixed: 8000, status: 'active' },
    { name: '日本高度人才套裝/首次設定', nameEn: 'STP Japan Highly Skilled Professional Setup', emoji: '🇯🇵', description: '聖多美公民申請日本高度人才簽證全套服務。', descriptionEn: 'Full service for STP citizens applying for Japan HSP visa.', category: 'immigration', priceMin: 350000, priceMax: 350000, currency: 'HKD', commissionRate: 0, commissionFixed: 80000, status: 'active' },
    { name: '高度人才套裝', nameEn: 'STP Highly Skilled Professional Package', emoji: '🇯🇵', description: '日本高度人才簽證續期及年度管理套裝。', descriptionEn: 'Japan HSP visa renewal and annual management.', category: 'immigration', priceMin: 50000, priceMax: 50000, currency: 'HKD', commissionRate: 0, commissionFixed: 12000, status: 'active' },
  ],
};

async function main() {
  console.log('Adding sub-products to Neon...');

  let totalCreated = 0;

  for (const [parentName, children] of Object.entries(SUB_PRODUCTS)) {
    // Find parent product by name
    const parent = await prisma.product.findFirst({ where: { name: parentName, parentId: null } });

    if (!parent) {
      console.log(`  ⚠️ Parent not found: ${parentName} (skipping)`);
      continue;
    }

    // Check if sub-products already exist
    const existing = await prisma.product.count({ where: { parentId: parent.id } });
    if (existing > 0) {
      console.log(`  ✅ ${parentName}: ${existing} sub-products already exist (skipping)`);
      continue;
    }

    for (const child of children) {
      await prisma.product.create({
        data: { ...child, parentId: parent.id },
      });
      totalCreated++;
    }
    console.log(`  ✅ ${parentName}: ${children.length} sub-products created`);
  }

  console.log(`\nDone! Total sub-products created: ${totalCreated}`);

  const totalProducts = await prisma.product.count();
  const parentCount = await prisma.product.count({ where: { parentId: null } });
  const childCount = await prisma.product.count({ where: { parentId: { not: null } } });
  console.log(`Total: ${totalProducts} products (${parentCount} parents, ${childCount} children)`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });