import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth-helpers';

// One-time endpoint: reset all products to correct 11-parent + 72-child structure
// Call: POST /api/seed/products  (admin only)
export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const roleCheck = requireRole(auth, 'admin');
    if (roleCheck instanceof NextResponse) return roleCheck;

    // 1. Delete all existing products
    const deleted = await db.product.deleteMany({});

    // 2. Create 11 parent products
    const parents = [
      { id: 'pp-001', name: '日本物業投資', nameEn: 'Japan Property Investment', emoji: '🏘️', description: '為客戶提供日本優質物業投資機會，涵蓋東京、大阪等主要城市住宅及商業物業。', descriptionEn: 'Premium Japanese property investment opportunities in Tokyo, Osaka and major cities.', category: 'investment', priceMin: 3245000, priceMax: 3520000, currency: 'HKD', commissionRate: 0, commissionFixed: 0, status: 'active' },
      { id: 'pp-002', name: '聖多美公民計劃/日本高度人才套裝', nameEn: 'STP Citizenship / Japan HSP Package', emoji: '🇸🇹', description: '聖多美及普林西比投資入籍計劃，快速審批、免簽多國。非CRS管轄區，4代覆蓋。', descriptionEn: 'STP investment citizenship program. Non-CRS jurisdiction, 4-generation coverage.', category: 'immigration', priceMin: 30000, priceMax: 1000000, currency: 'HKD', commissionRate: 0, commissionFixed: 0, status: 'active' },
      { id: 'pp-003', name: 'NPC基金', nameEn: 'NPC Fund', emoji: '📈', description: 'NPC基金專注於新興市場及另類投資，追求穩健回報。', descriptionEn: 'NPC Fund focuses on emerging markets and alternative investments.', category: 'fund', priceMin: 100000, priceMax: 1560000, currency: 'HKD', commissionRate: 8, commissionFixed: 0, status: 'active' },
      { id: 'pp-004', name: '家族信託', nameEn: 'Family Trust', emoji: '🏦', description: '為高淨值家族設立信託架構，實現資產保護、財富傳承及稅務優化。', descriptionEn: 'Trust structures for high-net-worth families for asset protection and wealth succession.', category: 'trust', priceMin: 4500000, priceMax: 4500000, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
      { id: 'pp-005', name: '公司秘書服務', nameEn: 'Company Secretary Service', emoji: '📋', description: '提供專業公司秘書及合規服務，包括公司註冊、年審、會計記帳、稅務申報等。', descriptionEn: 'Professional company secretary and compliance services.', category: 'corporate', priceMin: 6000, priceMax: 45000, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
      { id: 'pp-006', name: '香港證監會牌照服務', nameEn: 'Hong Kong SFC License Services', emoji: '🏛️', description: '提供香港證監會（SFC）牌照申請及顧問服務，涵蓋1號、4號、6號、9號牌照類型。', descriptionEn: 'Hong Kong SFC license application and advisory services for Type 1, 4, 6, 9 licenses.', category: 'corporate', priceMin: 350000, priceMax: 400000, currency: 'HKD', commissionRate: 10, commissionFixed: 0, status: 'active' },
      { id: 'pp-007', name: '外匯風險建模服務', nameEn: 'Forex Risk Modeling Service', emoji: '📊', description: '提供外匯風險評估、AI驅動分析及對沖策略諮詢服務。', descriptionEn: 'Forex risk assessment, AI-driven analytics and hedging strategy consulting.', category: 'technology', priceMin: 10000, priceMax: 600000, currency: 'HKD', commissionRate: 8, commissionFixed: 0, status: 'active' },
      { id: 'pp-008', name: 'MyPath AI', nameEn: 'MyPath AI', emoji: '📱', description: 'AI驅動的智能財富管理平台，提供個性化投資建議、風險評估及資產追蹤。', descriptionEn: 'AI-powered wealth management platform with personalized investment advice.', category: 'technology', priceMin: 2000, priceMax: 20000, currency: 'HKD', commissionRate: 20, commissionFixed: 0, status: 'coming_soon' },
      { id: 'pp-009', name: '香港法律服務', nameEn: 'Hong Kong Legal Services', emoji: '⚖️', description: '提供全方位香港法律服務，包括離婚訴訟、中港跨境法律、商業訴訟、刑事辯護等。', descriptionEn: 'Comprehensive Hong Kong legal services including divorce, cross-border, commercial litigation, criminal defense.', category: 'legal', priceMin: 10000, priceMax: 500000, currency: 'HKD', commissionRate: 12, commissionFixed: 0, status: 'active' },
      { id: 'pp-010', name: '家族辦公室專業認可證書課程', nameEn: 'Family Office Professional Certification', emoji: '🎓', description: '專為家族辦公室從業人員設計的專業認可課程。', descriptionEn: 'Professional certification course for family office practitioners.', category: 'education', priceMin: 1980, priceMax: 1980, currency: 'HKD', commissionRate: 0, commissionFixed: 0, status: 'active' },
      { id: 'pp-011', name: '樂天證券黃金CFD交易服務', nameEn: 'Gold CFD Trading Service', emoji: '🥇', description: '與樂天證券黃金合作提供的黃金差價合約交易服務。', descriptionEn: 'Gold CFD trading service with Rakuten Securities Bullion.', category: 'investment', priceMin: 2000, priceMax: 100000, currency: 'HKD', commissionRate: 0, commissionFixed: 0, commissionNegotiable: true, status: 'active' },
    ];

    for (const p of parents) {
      await db.product.create({ data: p });
    }

    // 3. Create all sub-products
    const sp = (id: string, parentId: string, name: string, nameEn: string, emoji: string, cat: string, pMin: number, pMax: number, cRate: number, cFixed: number, neg?: boolean, att?: string) => ({
      id, parentId, name, nameEn, emoji, description: name, descriptionEn: nameEn,
      category: cat, priceMin: pMin, priceMax: pMax, currency: 'HKD' as const,
      commissionRate: cRate, commissionFixed: cFixed,
      commissionNegotiable: neg || false, status: 'active' as const, attachmentUrl: att || null,
    });

    const allSubs: any[] = [
      // 日本物業投資 (7)
      sp('jp-1','pp-001','栖云8区画 A','Seiun 8 Kukaku A','🏘️','investment',3520000,3520000,0,112128),
      sp('jp-2','pp-001','栖云8区画 B','Seiun 8 Kukaku B','🏘️','investment',3245000,3245000,0,103368),
      sp('jp-3','pp-001','栖云8区画 C1','Seiun 8 Kukaku C1','🏘️','investment',3355000,3355000,0,106872),
      sp('jp-4','pp-001','栖云8区画 C2','Seiun 8 Kukaku C2','🏘️','investment',3355000,3355000,0,106872),
      sp('jp-5','pp-001','栖云8区画 C3','Seiun 8 Kukaku C3','🏘️','investment',3355000,3355000,0,106872),
      sp('jp-6','pp-001','栖云8区画 C4','Seiun 8 Kukaku C4','🏘️','investment',3272500,3272500,0,104244),
      sp('jp-7','pp-001','栖云8区画 C5','Seiun 8 Kukaku C5','🏘️','investment',3410000,3410000,0,108624),
      // 聖多美公民計劃 (5)
      sp('stp-1','pp-002','聖多美公民身份','STP Citizenship','🇸🇹','immigration',1000000,1000000,0,60000),
      sp('stp-2','pp-002','日本經營管理者簽/首次設定','STP Japan Business Manager Visa Setup','🇯🇵','immigration',150000,150000,0,40000),
      sp('stp-3','pp-002','經營管理者續簽','STP Business Manager Visa Renewal','🇯🇵','immigration',30000,30000,0,8000),
      sp('stp-4','pp-002','日本高度人才套裝/首次設定','STP Japan HSP Setup','🇯🇵','immigration',350000,350000,0,80000),
      sp('stp-5','pp-002','高度人才套裝','STP HSP Package','🇯🇵','immigration',50000,50000,0,12000),
      // NPC基金 (1)
      sp('npc-1','pp-003','NPC基金投資方案','NPC Fund Investment Plan','📈','fund',100000,1560000,8,0,false,'/attachments/npc_fund_presentation.pdf'),
      // 家族信託 (1)
      sp('trust-1','pp-004','設立香港家族信託','Set Up HK Family Trust','🏦','trust',4500000,4500000,0,0,true),
      // 公司秘書服務 (8)
      sp('corp-1','pp-005','Damon Lewis 公司秘書服務','DL Company Secretary','📋','corporate',6000,6000,0,0,true),
      sp('corp-2','pp-005','Damon Lewis 會計及稅務','DL Accounting & Tax','📋','corporate',45000,45000,0,0,true),
      sp('corp-3','pp-005','Damon Lewis 公司成立與合規','DL Company Formation','📋','corporate',8800,8800,0,0,true),
      sp('corp-4','pp-005','Damon Lewis 中小企融資顧問','DL SME Financing Advisory','📋','corporate',20000,20000,0,0,true),
      sp('corp-5','pp-005','Damon Lewis BUD專項基金申請','DL BUD Fund Application','📋','corporate',20000,20000,0,0,true),
      sp('corp-6','pp-005','Damon Lewis 貸款服務','DL Loan Services','📋','corporate',0,0,0,0,true),
      sp('corp-7','pp-005','Damon Lewis Plan D.2 (秘書+會計+成立)','DL Plan D.2','📋','corporate',29800,29800,0,0,true),
      sp('corp-8','pp-005','Damon Lewis Plan D.3 (秘書+成立+融資+BUD)','DL Plan D.3','📋','corporate',39998,39998,0,0,true),
      // 香港證監會牌照服務 (2)
      sp('sfc-1','pp-006','Big 4 & 9 License Type 4 + 9','Big 4 & 9 License Type 4 + 9','🏛️','corporate',400000,400000,0,60000),
      sp('sfc-2','pp-006','Big 9 License Type 9','Big 9 License Type 9','🏛️','corporate',350000,350000,0,60000),
      // 外匯風險建模服務 (5)
      sp('fx-1','pp-007','VaR風險值計算服務','VaR Risk Calculation Service','📊','technology',50000,200000,40,0),
      sp('fx-2','pp-007','敏感性分析服務','Sensitivity Analysis Service','📊','technology',30000,150000,40,0),
      sp('fx-3','pp-007','情景模擬分析服務','Scenario Simulation Service','📊','technology',100000,600000,40,0),
      sp('fx-4','pp-007','壓力測試服務','Stress Testing Service','📊','technology',40000,300000,40,0),
      sp('fx-5','pp-007','對沖策略設計及諮詢','Hedging Strategy Design & Consulting','📊','technology',80000,500000,40,0),
      // 香港法律服務 - 香港離婚 (7)
      sp('lg-01','pp-009','單方申請離婚（無爭議）','Uncontested Divorce Petition','⚖️','legal-hk-divorce',38000,38000,0,0),
      sp('lg-02','pp-009','雙方共同申請離婚','Joint Divorce Application','⚖️','legal-hk-divorce',32000,32000,0,0),
      sp('lg-03','pp-009','離婚協議書撰寫','Divorce Agreement Drafting','⚖️','legal-hk-divorce',8000,8000,0,0),
      sp('lg-04','pp-009','子女撫養權及探視安排','Child Custody & Access Arrangement','⚖️','legal-hk-divorce',15000,25000,0,0),
      sp('lg-05','pp-009','贍養費申請及評估','Alimony Application & Assessment','⚖️','legal-hk-divorce',12000,20000,0,0),
      sp('lg-06','pp-009','財產分配及資產調查','Asset Distribution & Investigation','⚖️','legal-hk-divorce',20000,50000,0,0),
      sp('lg-07','pp-009','臨時命令申請（禁制令/居住令）','Interim Order Application','⚖️','legal-hk-divorce',10000,18000,0,0),
      // 中港離婚 (7)
      sp('lg-08','pp-009','中港跨境離婚（香港訴訟）','Cross-border Divorce (HK)','⚖️','legal-cn-divorce',50000,80000,0,0),
      sp('lg-09','pp-009','中港跨境離婚（內地訴訟）','Cross-border Divorce (Mainland)','⚖️','legal-cn-divorce',40000,70000,0,0),
      sp('lg-10','pp-009','內地判決香港認可及登記','Mainland Judgment HK Recognition','⚖️','legal-cn-divorce',25000,35000,0,0),
      sp('lg-11','pp-009','香港判決內地認可及執行','HK Judgment Mainland Recognition','⚖️','legal-cn-divorce',30000,45000,0,0),
      sp('lg-12','pp-009','中港子女撫養權協調','Cross-border Child Custody','⚖️','legal-cn-divorce',25000,50000,0,0),
      sp('lg-13','pp-009','跨境財產追索及分割','Cross-border Asset Recovery','⚖️','legal-cn-divorce',40000,100000,0,0),
      sp('lg-14','pp-009','中港離婚公證及文件認證','Cross-border Divorce Notarization','⚖️','legal-cn-divorce',5000,12000,0,0),
      // 中港離婚附加 (9)
      sp('lg-15','pp-009','CN 律師推介及配合','CN Lawyer Referral','⚖️','legal-cn-options',10000,20000,0,0),
      sp('lg-16','pp-009','跨境資產調查 (內地)','Cross-border Asset Investigation','⚖️','legal-cn-options',20000,60000,0,0),
      sp('lg-17','pp-009','強制執行 (跨境)','Enforcement (Cross-border)','⚖️','legal-cn-options',30000,80000,0,0),
      sp('lg-18','pp-009','婚姻資產保護規劃','Matrimonial Asset Protection','⚖️','legal-cn-options',15000,40000,0,0),
      sp('lg-19','pp-009','法庭聆訊代表 (每次)','Court Hearing Rep (Per Session)','⚖️','legal-cn-options',5000,10000,0,0),
      sp('lg-20','pp-009','專家證人費用','Expert Witness Fee','⚖️','legal-cn-options',10000,30000,0,0),
      sp('lg-21','pp-009','文件翻譯及公證','Document Translation & Notarization','⚖️','legal-cn-options',2000,8000,0,0),
      sp('lg-22','pp-009','加急處理附加費','Expedited Processing Surcharge','⚖️','legal-cn-options',5000,15000,0,0),
      sp('lg-23','pp-009','外地法庭代表 (不含香港)','Overseas Court Rep (Excl. HK)','⚖️','legal-cn-options',15000,40000,0,0),
      // 額外收費 (5)
      sp('lg-24','pp-009','遺囑撰寫及見證','Will Drafting & Witnessing','⚖️','legal-extra',5000,12000,0,0),
      sp('lg-25','pp-009','遺產承辦及管理','Estate Administration','⚖️','legal-extra',30000,80000,0,0),
      sp('lg-26','pp-009','遺產爭訟','Estate Litigation','⚖️','legal-extra',50000,150000,0,0),
      sp('lg-27','pp-009','持久授權書','Enduring Power of Attorney','⚖️','legal-extra',8000,15000,0,0),
      sp('lg-28','pp-009','監護委員會申請','Guardianship Board Application','⚖️','legal-extra',20000,50000,0,0),
      // 律師代表 (9)
      sp('lg-29','pp-009','民事訴訟 - 區域法院','Civil Litigation - District Court','⚖️','legal-represent',50000,200000,0,0),
      sp('lg-30','pp-009','民事訴訟 - 高等法院','Civil Litigation - High Court','⚖️','legal-represent',100000,500000,0,0),
      sp('lg-31','pp-009','商業糾紛調解及仲裁','Commercial Dispute Mediation','⚖️','legal-represent',30000,150000,0,0),
      sp('lg-32','pp-009','企業併購法律顧問','M&A Legal Advisory','⚖️','legal-represent',100000,500000,0,0),
      sp('lg-33','pp-009','合約審閱及起草','Contract Review & Drafting','⚖️','legal-represent',10000,80000,0,0),
      sp('lg-34','pp-009','知識產權註冊及執行','IP Registration & Enforcement','⚖️','legal-represent',20000,200000,0,0),
      sp('lg-35','pp-009','勞資糾紛及僱傭問題','Employment Disputes','⚖️','legal-represent',15000,80000,0,0),
      sp('lg-36','pp-009','土地糾紛及業權爭議','Land Disputes & Title Disputes','⚖️','legal-represent',40000,200000,0,0),
      sp('lg-37','pp-009','移民法律諮詢及上訴','Immigration Legal Advisory','⚖️','legal-represent',15000,60000,0,0),
      // 刑事案件 (4)
      sp('lg-38','pp-009','刑事辯護 - 裁判法院','Criminal Defence - Magistrates','⚖️','legal-criminal',20000,80000,0,0),
      sp('lg-39','pp-009','刑事辯護 - 區域法院','Criminal Defence - District Court','⚖️','legal-criminal',50000,200000,0,0),
      sp('lg-40','pp-009','刑事上訴','Criminal Appeal','⚖️','legal-criminal',50000,300000,0,0),
      sp('lg-41','pp-009','刑事法律諮詢及保釋','Criminal Consultation & Bail','⚖️','legal-criminal',5000,20000,0,0),
      // 家族辦公室課程 (1)
      sp('edu-1','pp-010','家族辦公室專業認可證書課程','FO Professional Certification','🎓','education',1980,1980,0,600),
      // 樂天黃金CFD (1)
      sp('gold-1','pp-011','Standard Gold CFD Trading Account','Standard Gold CFD Trading','🥇','investment',2000,100000,0,0,true),
    ];

    const BATCH_SIZE = 20;
    for (let i = 0; i < allSubs.length; i += BATCH_SIZE) {
      const batch = allSubs.slice(i, i + BATCH_SIZE);
      await db.product.createMany({ data: batch, skipDuplicates: true });
    }

    const totalParents = await db.product.count({ where: { parentId: null } });
    const totalChildren = await db.product.count({ where: { parentId: { not: null } } });

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
      parents: totalParents,
      children: totalChildren,
      total: totalParents + totalChildren,
    });
  } catch (error: any) {
    console.error('Product reseed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}