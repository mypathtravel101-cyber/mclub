/**
 * Complete seed script for Neon PostgreSQL
 * 11 parent products + 80+ sub-products (including 77 JP properties from properties.json)
 * Usage: npx tsx scripts/seed-full.ts
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';

const NEON_URL = 'postgresql://neondb_owner:npg_IgKsQi54qphJ@ep-holy-wind-aoj7xyto-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const prisma = new PrismaClient({ datasources: { db: { url: NEON_URL } } });

interface Prop {
  id: string; name: string; address: string; city: string; type: string;
  status: string; landArea: string | null; buildingArea: string | null;
  floors: string | null; rooms: string | null; priceWan: number | null;
  rentalYield: number | null; availability: string;
}

// JPY to HKD approx rate: 1 JPY = 0.053 HKD, priceWan is in 萬JPY = 10000 JPY
function jpYenToHkd(wan: number): number {
  return Math.round(wan * 10000 * 0.053);
}

async function main() {
  console.log('=== Seeding Neon PostgreSQL: 11 Parents + 80+ Sub-products ===\n');

  // Clear existing products
  const delCount = await prisma.product.deleteMany();
  console.log(`Cleared ${delCount.count} existing products`);

  // Clear existing users and re-create
  await prisma.notification.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.order.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleared all existing data\n');

  // ===================== USERS =====================
  const pwd = await hash('demo123', 10);
  const admin = await prisma.user.create({ data: { email: 'admin@mclub.com', name: 'MCLUB Admin', password: pwd, role: 'admin', phone: '+85262277662' } });
  const u1 = await prisma.user.create({ data: { email: 'chan@mypath.hk', name: '陳志明', password: pwd, role: 'director', phone: '+85291234567' } });
  const u2 = await prisma.user.create({ data: { email: 'lee@mypath.hk', name: '李美琪', password: pwd, role: 'director' } });
  const u3 = await prisma.user.create({ data: { email: 'wong@mypath.hk', name: '黃偉業', password: pwd, role: 'director' } });
  const u4 = await prisma.user.create({ data: { email: 'bosco@mclub.com', name: 'Bosco', password: pwd, role: 'director' } });
  const u5 = await prisma.user.create({ data: { email: 'damon@mclub.com', name: 'Damon Lewis', password: pwd, role: 'director' } });
  console.log(`Created 6 users\n`);

  // ===================== PARENT PRODUCTS =====================
  const pp = (id: string, name: string, nameEn: string, emoji: string, desc: string, descEn: string, cat: string, pMin: number, pMax: number, cRate: number, cFixed: number, neg?: boolean) => ({
    id, name, nameEn, emoji, description: desc, descriptionEn: descEn, category: cat,
    priceMin: pMin, priceMax: pMax, currency: 'HKD', commissionRate: cRate, commissionFixed: cFixed,
    commissionNegotiable: neg || false, status: 'active',
  });

  const parents = [
    pp('pp-001', '日本物業投資', 'Japan Property Investment', '🏘️',
      '為客戶提供日本優質物業投資機會，涵蓋東京、大阪、福岡、長野/北海道等主要城市住宅及商業物業。',
      'Premium Japanese property investment in Tokyo, Osaka, Fukuoka, Hokkaido.',
      'investment', 550000, 125000000, 0, 0),
    pp('pp-002', '聖多美公民計劃/日本高度人才套裝', 'STP Citizenship / Japan HSP Package', '🇸🇹',
      '聖多美及普林西比投資入籍計劃，快速審批、免簽多國。非CRS管轄區，4代覆蓋。',
      'STP investment citizenship program. Non-CRS, 4-generation coverage.',
      'immigration', 30000, 1000000, 0, 0),
    pp('pp-003', 'NPC基金', 'NPC Fund', '📈',
      'NPC基金專注於新興市場及另類投資，為投資者提供多元化資產配置方案。',
      'NPC Fund focuses on emerging markets and alternative investments.',
      'fund', 100000, 1560000, 8, 0),
    pp('pp-004', '家族信託', 'Family Trust', '🏦',
      '為高淨值家族設立信託架構，實現資產保護、財富傳承及稅務優化。',
      'Trust structures for high-net-worth families for asset protection and wealth succession.',
      'trust', 4500000, 4500000, 0, 0, true),
    pp('pp-005', '公司秘書服務', 'Company Secretary Service', '📋',
      '提供專業公司秘書及合規服務，包括公司註冊、年審、會計記帳、稅務申報等。',
      'Professional company secretary and compliance services.',
      'corporate', 6000, 45000, 0, 0, true),
    pp('pp-006', 'MyPath AI', 'MyPath AI', '📱',
      'AI驅動的智能財富管理平台，提供個性化投資建議、風險評估及資產追蹤。',
      'AI-powered wealth management platform.',
      'technology', 2000, 20000, 20, 0),
    pp('pp-007', '香港法律服務', 'Hong Kong Legal Services', '⚖️',
      '提供全方位香港法律服務，包括離婚訴訟、中港跨境法律、商業訴訟、刑事辯護等。',
      'Comprehensive Hong Kong legal services.',
      'legal', 10000, 500000, 12, 0),
    pp('pp-008', '家族辦公室專業認可證書課程', 'Family Office Professional Certification', '🎓',
      '專為家族辦公室從業人員設計的專業認可課程，涵蓋財富管理、投資策略、稅務規劃。',
      'Professional certification for family office practitioners.',
      'education', 1980, 1980, 0, 0),
    pp('pp-009', '樂天證券黃金CFD交易服務', 'Gold CFD Trading Service', '🥇',
      '與樂天證券黃金合作提供的黃金差價合約交易服務，低點差、即時報價。',
      'Gold CFD trading service with Rakuten Securities Bullion.',
      'investment', 2000, 100000, 0, 0, true),
    pp('pp-010', 'VFK健康產品', 'VFK Health Products', '💊',
      '模塊化成功藍圖，Plan A/B/C三級會員制，提供全方位健康管理。',
      'Modular success blueprint with Plan A/B/C membership tiers.',
      'health', 4800, 29800, 15, 0),
    pp('pp-011', '英國教育諮詢', 'UK Education Consultancy', '🎓',
      '頂尖學校申請、監護人服務、留學規劃，英國教育全流程支援。',
      'UK top school applications, guardian services, study abroad planning.',
      'education', 50000, 500000, 10, 0),
  ];

  for (const p of parents) {
    await prisma.product.create({ data: p });
    console.log(`  Parent: ${p.name}`);
  }
  console.log(`\nCreated ${parents.length} parent products\n`);

  // Helper: create sub-product
  const sp = (id: string, parentId: string, name: string, nameEn: string, emoji: string, desc: string, descEn: string, cat: string, pMin: number, pMax: number, cRate: number, cFixed: number, neg?: boolean, att?: string) => ({
    id, parentId, name, nameEn, emoji, description: desc, descriptionEn: descEn, category: cat,
    priceMin: pMin, priceMax: pMax, currency: 'HKD', commissionRate: cRate, commissionFixed: cFixed,
    commissionNegotiable: neg || false, status: 'active', attachmentUrl: att || null,
  });

  // ===================== STP 子產品 (5) =====================
  const stpSubs = [
    sp('stp-001','pp-002','聖多美公民身份','STP Citizenship','🇸🇹','聖多美及普林西比投資入籍計劃，快速審批、免簽多國，非CRS管轄區，4代覆蓋。','STP investment citizenship. Non-CRS, 4-generation coverage.','immigration',1000000,1000000,0,60000),
    sp('stp-002','pp-002','日本經營管理者簽/首次設定','STP Japan Business Manager Visa Setup','🇯🇵','聖多美公民申請日本經營管理者簽證首次設定全套服務。','Full setup for STP citizens applying for Japan Business Manager visa.','immigration',150000,150000,0,40000),
    sp('stp-003','pp-002','經營管理者續簽','STP Business Manager Visa Renewal','🇯🇵','日本經營管理者簽證續期及年度管理套裝。','Japan Business Manager visa renewal and annual management.','immigration',30000,30000,0,8000),
    sp('stp-004','pp-002','日本高度人才套裝/首次設定','STP Japan HSP Setup','🇯🇵','聖多美公民申請日本高度人才簽證全套服務，最快1年可申請永住。','Full HSP visa service, eligible for PR in 1 year.','immigration',350000,350000,0,80000),
    sp('stp-005','pp-002','高度人才套裝','STP HSP Package','🇯🇵','日本高度人才簽證續期及年度管理套裝。','HSP visa renewal and annual management.','immigration',50000,50000,0,12000),
  ];

  // ===================== NPC 子產品 (1) =====================
  const npcSubs = [
    sp('npc-001','pp-003','NPC基金投資方案','NPC Fund Investment Plan','📈','NPC基金投資方案，靈活投資額度，專注新興市場及另類投資。','NPC Fund with flexible investment amounts.','fund',100000,1560000,8,0,false,'/attachments/npc_fund_presentation.pdf'),
  ];

  // ===================== 信託 子產品 (1) =====================
  const trustSubs = [
    sp('trust-001','pp-004','設立香港家族信託','Set Up HK Family Trust','🏦','設立香港家族信託架構，資產保護、財富傳承及稅務優化。','HK family trust for asset protection and wealth succession.','trust',4500000,4500000,0,0,true),
  ];

  // ===================== 公司秘書 子產品 (8) =====================
  const corpSubs = [
    sp('corp-001','pp-005','Damon Lewis 公司秘書服務','DL Company Secretary','📋','專業公司秘書服務，公司年審、法定申報、董事會議安排。','Company secretary service: annual returns, statutory filings.','corporate',6000,6000,0,0,true),
    sp('corp-002','pp-005','Damon Lewis 會計及稅務','DL Accounting & Tax','📋','會計及稅務服務，記帳、稅務申報、財務報表編製。','Accounting and tax: bookkeeping, tax filing, financial statements.','corporate',45000,45000,0,0,true),
    sp('corp-003','pp-005','Damon Lewis 公司成立與合規','DL Company Formation','📋','公司成立與合規服務，香港及離岸公司註冊、商業登記。','Company formation: HK and offshore registration.','corporate',8800,8800,0,0,true),
    sp('corp-004','pp-005','Damon Lewis 中小企融資顧問','DL SME Financing Advisory','📋','中小企融資顧問服務，融資策略規劃、貸款申請。','SME financing advisory: fund-raising strategy, loan applications.','corporate',20000,20000,0,0,true),
    sp('corp-005','pp-005','Damon Lewis BUD專項基金申請','DL BUD Fund Application','📋','BUD專項基金申請服務，品牌發展、升級轉型。','BUD Fund application: brand development, upgrading.','corporate',20000,20000,0,0,true),
    sp('corp-006','pp-005','Damon Lewis 貸款服務','DL Loan Services','📋','商業貸款、企業融資及資金周轉方案。','Commercial loans, enterprise financing, cash flow solutions.','corporate',0,0,0,0,true),
    sp('corp-007','pp-005','Damon Lewis Plan D.2 (秘書+會計+成立)','DL Plan D.2','📋','Plan D.2 套裝：公司秘書+會計稅務+公司成立。','Plan D.2: Secretary + Accounting + Formation.','corporate',29800,29800,0,0,true),
    sp('corp-008','pp-005','Damon Lewis Plan D.3 (秘書+成立+融資+BUD)','DL Plan D.3','📋','Plan D.3 套裝：公司秘書+成立+融資顧問+BUD基金。','Plan D.3: Secretary + Formation + Financing + BUD.','corporate',39998,39998,0,0,true),
  ];

  // ===================== 黃金CFD 子產品 (1) =====================
  const goldSubs = [
    sp('gold-001','pp-009','Standard Gold CFD Trading Account','Standard Gold CFD','🥇','標準黃金CFD交易賬戶，最低HK$2,000，樂天證券黃金專業交易平台。','Standard Gold CFD account, min HK$2,000, Rakuten Securities platform.','investment',2000,100000,0,0,true),
  ];

  // ===================== 課程 子產品 (1) =====================
  const eduSubs = [
    sp('edu-001','pp-008','家族辦公室專業認可證書課程','FO Professional Certification','🎓','涵蓋財富管理、投資策略、稅務規劃、繼承安排等核心模組。','Covers wealth management, investment, tax planning, succession.','education',1980,1980,0,600),
  ];

  // ===================== VFK 子產品 (3) =====================
  const vfkSubs = [
    sp('vfk-001','pp-010','VFK Plan A','VFK Plan A','💊','基礎健康管理方案，適合初次接觸的會員。','Basic health management for new members.','health',4800,4800,15,0),
    sp('vfk-002','pp-010','VFK Plan B','VFK Plan B','💊','進階健康管理方案，包含個人化健康諮詢及跟進。','Advanced health management with personalized consultation.','health',12800,12800,15,0),
    sp('vfk-003','pp-010','VFK Plan C','VFK Plan C','💊','頂級全方位健康管理及成功路徑規劃，一對一專屬顧問。','Premium all-round health management with 1-on-1 advisor.','health',29800,29800,15,0),
  ];

  // ===================== 英國教育 子產品 (4) =====================
  const ukSubs = [
    sp('uk-001','pp-011','英國頂尖學校申請','UK Top School Application','🎓','英國頂尖私立學校及大學申請，選校顧問、文件準備、面試培訓。','UK top school/university application: selection, docs, interview training.','education',50000,200000,10,0),
    sp('uk-002','pp-011','英國監護人服務','UK Guardian Service','🎓','為在英國就讀的未成年人提供專業監護人服務。','Guardian service for minors studying in the UK.','education',30000,80000,10,0),
    sp('uk-003','pp-011','英國留學規劃顧問','UK Study Planning','🎓','英國留學全程規劃，選課、簽證到落地安頓。','Full UK study planning: courses, visa, settlement.','education',20000,50000,10,0),
    sp('uk-004','pp-011','英國暑期遊學團','UK Summer Study Tour','🎓','英國暑期遊學團，體驗英國文化及教育環境。','UK summer study tours for cultural immersion.','education',30000,80000,10,0),
  ];

  // ===================== 法律服務 子產品 (25) =====================
  const legalSubs = [
    // 香港離婚收費表
    sp('lg-001','pp-007','單方離婚申請（無爭議）','Uncontested Divorce Petition','⚖️','單方向法院提交離婚呈請書，適用於雙方無爭議的離婚案件。','Filing uncontested divorce petition.','legal-hk-divorce',50000,80000,0,0),
    sp('lg-002','pp-007','雙方共同申請離婚','Joint Divorce Application','⚖️','雙方同意共同申請離婚，手續簡化、時間較短。','Joint application for divorce by mutual consent.','legal-hk-divorce',40000,60000,0,0),
    sp('lg-003','pp-007','離婚贍養費及財產分配','Divorce Alimony & Asset Distribution','⚖️','處理離婚後的贍養費及夫妻財產分配事宜。','Post-divorce alimony and asset distribution.','legal-hk-divorce',80000,200000,0,0),
    sp('lg-004','pp-007','子女撫養權及探視安排','Child Custody & Access','⚖️','處理離婚後的子女撫養權及探視權安排。','Child custody and access arrangements.','legal-hk-divorce',50000,150000,0,0),
    sp('lg-005','pp-007','暫准判令轉永久判令','Decree Nisi to Absolute','⚖️','協助申請將離婚暫准判令轉為永久判令。','Convert Decree Nisi to Decree Absolute.','legal-hk-divorce',10000,20000,0,0),
    sp('lg-006','pp-007','分居協議書起草','Separation Deed','⚖️','為選擇分居的夫婦起草分居協議書。','Drafting separation deed.','legal-hk-divorce',15000,30000,0,0),
    // 中港離婚收費表
    sp('lg-007','pp-007','中港跨境離婚諮詢','Cross-border Divorce Consultation','⚖️','涉及中國大陸及香港的跨境離婚法律諮詢。','Cross-border divorce legal consultation (HK-CN).','legal-cn-divorce',30000,50000,0,0),
    sp('lg-008','pp-007','中國大陸離婚訴訟代理','Mainland Divorce Litigation','⚖️','代表客戶在中國大陸法院進行離婚訴訟。','Representing clients in mainland divorce litigation.','legal-cn-divorce',80000,200000,0,0),
    sp('lg-009','pp-007','香港承認大陸離婚判決','HK Recognition of CN Decree','⚖️','協助申請香港法院承認中國大陸的離婚判決。','HK court recognition of mainland divorce decrees.','legal-cn-divorce',50000,100000,0,0),
    sp('lg-010','pp-007','中港跨境財產分割','Cross-border Asset Division','⚖️','處理涉及中港兩地資產的離婚財產分割。','Cross-border asset division in divorce.','legal-cn-divorce',100000,300000,0,0),
    // 中港離婚附加選項
    sp('lg-011','pp-007','緊急禁止令申請','Emergency Injunction','⚖️','離婚訴訟中申請緊急禁止令，保護當事人及子女安全。','Emergency injunction for protection in divorce.','legal-cn-options',30000,80000,0,0),
    sp('lg-012','pp-007','資產保全申請','Asset Preservation','⚖️','申請法院命令凍結或保護婚姻資產。','Court order to freeze or protect matrimonial assets.','legal-cn-options',20000,50000,0,0),
    sp('lg-013','pp-007','子女強制執行令','Access Enforcement Order','⚖️','當一方不遵守探視安排時申請強制執行令。','Enforcement order for access arrangements.','legal-cn-options',20000,50000,0,0),
    // 離婚服務額外收費
    sp('lg-014','pp-007','加急服務費','Expedited Service Fee','⚖️','需要加急處理的離婚案件額外收費。','Additional fee for expedited divorce processing.','legal-extra',10000,30000,0,0),
    sp('lg-015','pp-007','翻譯及公證費','Translation & Notarization','⚖️','中英文法律文件翻譯及公證服務。','Translation and notarization for bilingual documents.','legal-extra',5000,15000,0,0),
    sp('lg-016','pp-007','差旅費（大陸出差）','Travel Expenses (Mainland)','⚖️','律師前往中國大陸處理案件的差旅費用。','Lawyer travel expenses for mainland cases.','legal-extra',8000,20000,0,0),
    // 離婚服務遺項式收費
    sp('lg-017','pp-007','初步法律諮詢（首小時）','Initial Consultation (1hr)','⚖️','離婚案件初步法律諮詢，評估法律立場。','Initial divorce consultation to assess case.','legal-extract',3000,5000,0,0),
    sp('lg-018','pp-007','文件審閱（每份）','Document Review (Per Doc)','⚖️','審閱離婚相關法律文件，提供法律意見。','Review of divorce legal documents.','legal-extract',2000,5000,0,0),
    sp('lg-019','pp-007','出席法庭代表（每次）','Court Attendance (Per Session)','⚖️','代表客戶出席法庭聆訊。','Representing client at court hearings.','legal-extract',5000,15000,0,0),
    sp('lg-020','pp-007','書面法律意見書','Written Legal Opinion','⚖️','就特定法律問題提供書面法律意見。','Written legal opinion on specific issues.','legal-extract',8000,25000,0,0),
    // 律師代表費用收費表
    sp('lg-021','pp-007','民事訴訟代表','Civil Litigation Representation','⚖️','代表客戶進行民事訴訟，包括起草訴狀及出庭辯護。','Representing clients in civil litigation.','legal-represent',100000,500000,0,0),
    sp('lg-022','pp-007','商業合約審閱及起草','Commercial Contract Review','⚖️','商業合約的審閱、修改及起草服務。','Commercial contract review, amendment, and drafting.','legal-represent',20000,100000,0,0),
    sp('lg-023','pp-007','企業合併收購法律顧問','M&A Legal Advisory','⚖️','企業併購全流程法律顧問服務。','Full-cycle M&A legal advisory.','legal-represent',200000,500000,0,0),
    // 刑事案件
    sp('lg-024','pp-007','刑事辯護（裁判法院）','Criminal Defense (Magistrates)','⚖️','在裁判法院代表被告進行刑事辯護。','Criminal defense representation at Magistrates Court.','legal-criminal',50000,200000,0,0),
    sp('lg-025','pp-007','刑事上訴','Criminal Appeal','⚖️','就刑事判決提出上訴，包括起草上訴理由及出庭。','Criminal appeal: drafting grounds and court appearance.','legal-criminal',100000,300000,0,0),
  ];

  // Insert all non-property sub-products
  const allManualSubs = [...stpSubs, ...npcSubs, ...trustSubs, ...corpSubs, ...goldSubs, ...eduSubs, ...vfkSubs, ...ukSubs, ...legalSubs];
  for (const s of allManualSubs) {
    await prisma.product.create({ data: s as any });
  }
  console.log(`Created ${allManualSubs.length} manual sub-products\n`);

  // ===================== 日本物業 子產品 (from properties.json) =====================
  const propsPath = path.join(__dirname, '..', 'src', 'lib', 'properties.json');
  const propsData: Prop[] = JSON.parse(fs.readFileSync(propsPath, 'utf-8'));
  console.log(`Loaded ${propsData.length} properties from properties.json`);

  let jpCount = 0;
  for (const prop of propsData) {
    const priceHkd = prop.priceWan ? jpYenToHkd(prop.priceWan) : 0;
    const yieldStr = prop.rentalYield ? `${prop.rentalYield}%` : 'N/A';
    const cityLabel = prop.city || '日本';
    const typeLabel = prop.type || '物業';
    const statusLabel = prop.status || '';
    const availLabel = prop.availability || '';
    const areaInfo = prop.landArea ? `土地${prop.landArea}㎡` : '';
    const bldgInfo = prop.buildingArea ? `建築${prop.buildingArea}㎡` : '';
    const descParts = [cityLabel, prop.name, typeLabel, statusLabel, `租金回報${yieldStr}`, availLabel, areaInfo, bldgInfo, prop.address].filter(Boolean);
    const descZh = descParts.join(' | ');
    const descEn = `${prop.name} (${prop.nameEn || prop.name}) - ${cityLabel} ${typeLabel}, ${yieldStr} yield, ${availLabel}`;

    // Commission: 3% of price for properties with price
    const commission = Math.round(priceHkd * 0.03);

    await prisma.product.create({
      data: {
        id: `jp-${prop.id}`,
        parentId: 'pp-001',
        name: prop.name,
        nameEn: prop.name,
        emoji: '🏘️',
        description: descZh,
        descriptionEn: descEn,
        category: 'investment',
        priceMin: priceHkd,
        priceMax: priceHkd,
        currency: 'HKD',
        commissionRate: 0,
        commissionFixed: commission,
        status: prop.availability === '已售' ? 'inactive' : (prop.availability === '在建' || prop.availability === '待建' ? 'active' : 'active'),
      },
    });
    jpCount++;
  }
  console.log(`Created ${jpCount} Japan property sub-products\n`);

  // ===================== EVENTS =====================
  const e1 = await prisma.event.create({ data: { title: 'MCLUB 2026 夏季投資論壇', description: '探討家族辦公室資產配置策略，邀請行業專家分享市場見解', type: 'seminar', date: new Date('2026-07-15T14:00:00'), location: '香港四季酒店宴會廳', maxAttendees: 50, status: 'upcoming' } });
  const e2 = await prisma.event.create({ data: { title: '日本物業投資說明會', description: '大阪物業投資機會深度解析，6%租金保證方案', type: 'webinar', date: new Date('2026-07-22T10:00:00'), location: '線上 Zoom 會議', maxAttendees: 30, status: 'upcoming' } });
  const e3 = await prisma.event.create({ data: { title: 'VFK健康產品體驗日', description: '產品試用及健康諮詢，會員專享', type: 'training', date: new Date('2026-08-05T15:00:00'), location: 'MCLUB會所', maxAttendees: 20, status: 'upcoming' } });
  await prisma.eventParticipant.createMany({ data: [
    { eventId: e1.id, userId: u1.id, status: 'registered' },
    { eventId: e1.id, userId: u2.id, status: 'attended' },
    { eventId: e2.id, userId: u1.id, status: 'registered' },
    { eventId: e2.id, userId: u3.id, status: 'registered' },
  ]});
  console.log('Created 3 events\n');

  // ===================== NOTICES =====================
  await prisma.notice.createMany({ data: [
    { title: '系統升級通知', content: 'MCLUB CRM已升級至v3.0版本，新增JWT認證、分頁功能及客戶詳情頁面。', category: 'announcement', targetRoles: 'admin,director', authorId: admin.id, isPinned: true, isActive: true },
    { title: '夏季投資論壇報名開放', content: 'MCLUB 2026夏季投資論壇現已接受報名，名額有限，先到先得。', category: 'announcement', targetRoles: 'admin,director', authorId: admin.id, isPinned: false, isActive: true },
    { title: '合規政策更新', content: '請所有總監務必閱讀最新的KYC/AML合規政策。', category: 'policy', targetRoles: 'director', authorId: admin.id, isPinned: true, isActive: true },
  ]});
  console.log('Created 3 notices\n');

  // ===================== VERIFY =====================
  const totalParents = await prisma.product.count({ where: { parentId: null } });
  const totalChildren = await prisma.product.count({ where: { parentId: { not: null } } });
  const totalProducts = totalParents + totalChildren;
  console.log('=== SEED COMPLETE ===');
  console.log(`  Users:         6`);
  console.log(`  Parent Prods:  ${totalParents}`);
  console.log(`  Sub-products:  ${totalChildren}`);
  console.log(`  Total Prods:   ${totalProducts}`);
  console.log(`  Events:        3`);
  console.log(`  Notices:       3`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Seed failed:', e);
  prisma.$disconnect();
  process.exit(1);
});