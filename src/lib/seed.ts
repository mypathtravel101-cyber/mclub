import { db } from './db';
import { hash } from 'bcryptjs';

// Parent products (shown on main ProductsPage grid)
const PARENT_PRODUCTS = [
  {
    name: '日本物業投資',
    nameEn: 'Japan Property Investment',
    emoji: '🏘️',
    description: '為客戶提供日本優質物業投資機會，涵蓋東京、大阪等主要城市住宅及商業物業。專業團隊提供選址分析、貸款安排、物業管理一站式服務。',
    descriptionEn: 'Premium Japanese property investment opportunities in Tokyo, Osaka and major cities. Professional team provides location analysis, financing, and property management.',
    category: 'investment',
    priceMin: 3245000,
    priceMax: 3520000,
    currency: 'HKD',
    commissionRate: 0,
    commissionFixed: 0,
    status: 'active',
  },
  {
    name: '聖多美公民計劃/日本高度人才套裝',
    nameEn: 'STP Citizenship Program / Japan HSP Package',
    emoji: '🇸🇹',
    description: '聖多美及普林西比投資入籍計劃，快速審批、免簽多國，助力全球資產配置及出行便利。非CRS管轄區，4代覆蓋，完整公民身份。含公民身份、經營管理者簽證及高度人才簽證等子產品。',
    descriptionEn: 'São Tomé and Príncipe investment citizenship program. Fast approval, visa-free access, non-CRS jurisdiction, 4-generation coverage. Includes citizenship, business manager visa, and HSP visa sub-products.',
    category: 'immigration',
    priceMin: 30000,
    priceMax: 1000000,
    currency: 'HKD',
    commissionRate: 0,
    commissionFixed: 0,
    status: 'active',
  },
  {
    name: 'NPC基金',
    nameEn: 'NPC Fund',
    emoji: '📈',
    description: 'NPC基金專注於新興市場及另類投資，為投資者提供多元化資產配置方案。由專業基金經理管理，追求穩健回報。',
    descriptionEn: 'NPC Fund focuses on emerging markets and alternative investments, offering diversified asset allocation. Managed by professional fund managers for steady returns.',
    category: 'fund',
    priceMin: 100000,
    priceMax: 1560000,
    currency: 'HKD',
    commissionRate: 8.0,
    status: 'active',
  },
  {
    name: '家族信託',
    nameEn: 'Family Trust',
    emoji: '🏦',
    description: '為高淨值家族設立信託架構，實現資產保護、財富傳承及稅務優化。涵蓋離岸信託、目的信託等多種方案。',
    descriptionEn: 'Establish trust structures for high-net-worth families for asset protection, wealth succession and tax optimization. Includes offshore and purpose trust solutions.',
    category: 'trust',
    priceMin: 4500000,
    priceMax: 4500000,
    currency: 'HKD',
    commissionRate: 0,
    commissionFixed: 0,
    commissionNegotiable: true,
    status: 'active',
  },
  {
    name: '公司秘書服務',
    nameEn: 'Company Secretary Service',
    emoji: '📋',
    description: '提供專業公司秘書及合規服務，包括公司註冊、年審、會計記帳、稅務申報等。確保企業持續合規營運。',
    descriptionEn: 'Professional company secretary and compliance services including incorporation, annual returns, accounting, and tax filing. Ensure ongoing corporate compliance.',
    category: 'corporate',
    priceMin: 6000,
    priceMax: 45000,
    currency: 'HKD',
    commissionRate: 0,
    commissionFixed: 0,
    commissionNegotiable: true,
    status: 'active',
  },
  {
    name: 'MyPath AI',
    nameEn: 'MyPath AI',
    emoji: '📱',
    description: 'AI驅動的智能財富管理平台，為客戶提供個性化投資建議、風險評估及資產追蹤。利用大數據分析，精準匹配投資機會。',
    descriptionEn: 'AI-powered wealth management platform providing personalized investment advice, risk assessment, and asset tracking. Big data analytics for precise investment matching.',
    category: 'technology',
    priceMin: 2000,
    priceMax: 20000,
    currency: 'HKD',
    commissionRate: 20.0,
    status: 'active',
  },
  {
    name: '香港法律服務',
    nameEn: 'Hong Kong Legal Services',
    emoji: '⚖️',
    description: '提供全方位香港法律服務，包括商業訴訟、企業併購法律顧問、合約起草及審閱、知識產權保護、移民法律支援等。由資深執業律師團隊提供專業意見。',
    descriptionEn: 'Comprehensive Hong Kong legal services including commercial litigation, M&A advisory, contract drafting and review, IP protection, and immigration legal support.',
    category: 'legal',
    priceMin: 10000,
    priceMax: 500000,
    currency: 'HKD',
    commissionRate: 12.0,
    status: 'active',
  },
  {
    name: '家族辦公室專業認可證書課程',
    nameEn: 'Family Office Professional Certification',
    emoji: '🎓',
    description: '專為家族辦公室從業人員設計的專業認可課程，涵蓋家族財富管理、投資策略、稅務規劃、繼承安排等核心模組。完成課程可獲得專業認可資格，提升行業競爭力。',
    descriptionEn: 'Professional certification course for family office practitioners covering family wealth management, investment strategies, tax planning, and succession. Industry-recognized qualification.',
    category: 'education',
    priceMin: 1980,
    priceMax: 1980,
    currency: 'HKD',
    commissionRate: 0,
    commissionFixed: 0,
    status: 'active',
  },
  {
    name: '樂天證券黃金CFD交易服務',
    nameEn: '樂天證券黃金CFD交易服務',
    emoji: '🥇',
    description: '與樂天證券黃金合作提供的黃金差價合約（CFD）交易服務，讓客戶以槓桿方式參與國際黃金市場，掌握避險與投資雙重機遇。專業交易平台、低點差、即時報價，適合短線及中長線黃金投資者。',
    descriptionEn: 'Gold CFD trading service in partnership with Rakuten Securities Bullion. Leveraged access to international gold markets with professional trading platform, tight spreads, and real-time quotes. Suitable for short-term and medium-to-long-term gold investors.',
    category: 'investment',
    priceMin: 2000,
    priceMax: 100000,
    currency: 'HKD',
    commissionRate: 0,
    commissionFixed: 0,
    commissionNegotiable: true,
    status: 'active',
  },
];

// Sub-products (children of parent products)
// Key = parent product name, Value = array of sub-products
const SUB_PRODUCTS: Record<string, Array<{
  name: string; nameEn: string; emoji: string; description: string; descriptionEn: string;
  category: string; priceMin: number; priceMax: number; currency: string;
  commissionRate: number; commissionFixed: number; commissionNegotiable?: boolean; status: string;
  attachmentUrl?: string;
}>> = {
  '日本物業投資': [
    {
      name: '栖云8区画 A',
      nameEn: 'Seiun 8 Kukaku A',
      emoji: '🏘️',
      description: '栖云8区画 A型日本物業投資項目，位於優質地段，提供穩定租金回報及資本增值潛力。專業物業管理團隊提供全方位租賃及維護服務。',
      descriptionEn: 'Seiun 8 Kukaku Type A property investment in premium location. Stable rental yield and capital appreciation potential with full property management service.',
      category: 'investment',
      priceMin: 3520000,
      priceMax: 3520000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 112128,
      status: 'active',
    },
    {
      name: '栖云8区画 B',
      nameEn: 'Seiun 8 Kukaku B',
      emoji: '🏘️',
      description: '栖云8区画 B型日本物業投資項目，適合中型投資者，平衡租金收益與升值空間。包含物業管理及稅務申報支援服務。',
      descriptionEn: 'Seiun 8 Kukaku Type B property investment for mid-scale investors. Balanced rental income and appreciation potential with management and tax support.',
      category: 'investment',
      priceMin: 3245000,
      priceMax: 3245000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 103368,
      status: 'active',
    },
    {
      name: '栖云8区画 C1',
      nameEn: 'Seiun 8 Kukaku C1',
      emoji: '🏘️',
      description: '栖云8区画 C1型高端日本物業投資項目，位於核心地段，提供卓越租金回報率。配套專業租賃管理及年度財務報告服務。',
      descriptionEn: 'Seiun 8 Kukaku C1 premium property investment in core location. Exceptional rental yield with professional leasing management and annual financial reporting.',
      category: 'investment',
      priceMin: 3355000,
      priceMax: 3355000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 106872,
      status: 'active',
    },
    {
      name: '栖云8区画 C2',
      nameEn: 'Seiun 8 Kukaku C2',
      emoji: '🏘️',
      description: '栖云8区画 C2型高端日本物業投資項目，延續C系列優質選址標準，配備完善物業管理及投資組合優化建議。',
      descriptionEn: 'Seiun 8 Kukaku C2 premium property continuing the C-series quality standard. Full property management and portfolio optimization advisory included.',
      category: 'investment',
      priceMin: 3355000,
      priceMax: 3355000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 106872,
      status: 'active',
    },
    {
      name: '栖云8区画 C3',
      nameEn: 'Seiun 8 Kukaku C3',
      emoji: '🏘️',
      description: '栖云8区画 C3型高端日本物業投資項目，精選黃金地段物業，提供穩健投資回報。包含租戶篩選及物業保險安排服務。',
      descriptionEn: 'Seiun 8 Kukaku C3 premium property in prime location. Steady investment returns with tenant screening and property insurance arrangement services.',
      category: 'investment',
      priceMin: 3355000,
      priceMax: 3355000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 106872,
      status: 'active',
    },
    {
      name: '栖云8区画 C4',
      nameEn: 'Seiun 8 Kukaku C4',
      emoji: '🏘️',
      description: '栖云8区画 C4型高端日本物業投資項目，位於發展潛力區域，中長期資本增值前景優越。附設翻新及資產提升方案。',
      descriptionEn: 'Seiun 8 Kukaku C4 premium property in high-growth area. Superior mid-to-long term capital appreciation with renovation and asset enhancement plans.',
      category: 'investment',
      priceMin: 3272500,
      priceMax: 3272500,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 104244,
      status: 'active',
    },
    {
      name: '栖云8区画 C5',
      nameEn: 'Seiun 8 Kukaku C5',
      emoji: '🏘️',
      description: '栖云8区画 C5型頂級日本物業投資項目，精選核心地段稀缺物業，提供最高規格物業管理及私人禮賓服務。',
      descriptionEn: 'Seiun 8 Kukaku C5 top-tier property in scarce core location. Premium property management and private concierge services at the highest standard.',
      category: 'investment',
      priceMin: 3410000,
      priceMax: 3410000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 108624,
      status: 'active',
    },
  ],
  'NPC基金': [
    {
      name: 'NPC基金投資方案',
      nameEn: 'NPC Fund Investment Plan',
      emoji: '📈',
      description: 'NPC基金投資方案，提供靈活投資額度，由專業基金經理管理，專注新興市場及另類投資，追求穩健回報及資本增值。',
      descriptionEn: 'NPC Fund investment plan with flexible investment amounts. Managed by professional fund managers focusing on emerging markets and alternative investments for steady returns.',
      category: 'fund',
      priceMin: 100000,
      priceMax: 1560000,
      currency: 'HKD',
      commissionRate: 8.0,
      commissionFixed: 0,
      attachmentUrl: '/attachments/npc_fund_presentation.pdf',
      status: 'active',
    },
  ],
  '家族辦公室專業認可證書課程': [
    {
      name: '家族辦公室專業認可證書課程',
      nameEn: 'Family Office Professional Certification',
      emoji: '🎓',
      description: '專為家族辦公室從業人員設計的專業認可課程，涵蓋家族財富管理、投資策略、稅務規劃、繼承安排等核心模組。完成課程可獲得專業認可資格，提升行業競爭力。',
      descriptionEn: 'Professional certification course for family office practitioners covering family wealth management, investment strategies, tax planning, and succession. Industry-recognized qualification.',
      category: 'education',
      priceMin: 1980,
      priceMax: 1980,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 600,
      status: 'active',
    },
  ],
  '公司秘書服務': [
    {
      name: 'Damon Lewis 公司秘書服務',
      nameEn: 'Damon Lewis Company Secretary Service',
      emoji: '📋',
      description: 'Damon Lewis 專業公司秘書服務，提供公司年審、法定申報、董事會議安排等合規支援。',
      descriptionEn: 'Damon Lewis professional company secretary service for annual returns, statutory filings, and board meeting arrangements.',
      category: 'corporate',
      priceMin: 6000,
      priceMax: 6000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 0,
      commissionNegotiable: true,
      status: 'active',
    },
    {
      name: 'Damon Lewis 會計及稅務',
      nameEn: 'Damon Lewis Accounting & Tax',
      emoji: '📋',
      description: 'Damon Lewis 會計及稅務服務，提供專業記帳、稅務申報、財務報表編製等全方位會計支援。',
      descriptionEn: 'Damon Lewis accounting and tax services including bookkeeping, tax filing, and financial statement preparation.',
      category: 'corporate',
      priceMin: 45000,
      priceMax: 45000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 0,
      commissionNegotiable: true,
      status: 'active',
    },
    {
      name: 'Damon Lewis 公司成立與合規',
      nameEn: 'Damon Lewis Company Formation & Compliance',
      emoji: '📋',
      description: 'Damon Lewis 公司成立與合規服務，涵蓋香港及離岸公司註冊、商業登記、合規架構設立。',
      descriptionEn: 'Damon Lewis company formation and compliance services covering Hong Kong and offshore company registration.',
      category: 'corporate',
      priceMin: 8800,
      priceMax: 8800,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 0,
      commissionNegotiable: true,
      status: 'active',
    },
    {
      name: 'Damon Lewis 中小企融資顧問',
      nameEn: 'Damon Lewis SME Financing Advisory',
      emoji: '📋',
      description: 'Damon Lewis 中小企融資顧問服務，為中小企業提供融資策略規劃、貸款申請及資金管理顧問。',
      descriptionEn: 'Damon Lewis SME financing advisory providing fund-raising strategy, loan application and capital management consultancy.',
      category: 'corporate',
      priceMin: 20000,
      priceMax: 20000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 0,
      commissionNegotiable: true,
      status: 'active',
    },
    {
      name: 'Damon Lewis BUD專項基金申請',
      nameEn: 'Damon Lewis BUD Fund Application',
      emoji: '📋',
      description: 'Damon Lewis BUD專項基金申請服務，協助企業申請品牌發展、升級轉型及拓展內銷市場基金。',
      descriptionEn: 'Damon Lewis BUD Fund application service assisting enterprises in applying for brand development, upgrading and domestic market expansion funds.',
      category: 'corporate',
      priceMin: 20000,
      priceMax: 20000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 0,
      commissionNegotiable: true,
      status: 'active',
    },
    {
      name: 'Damon Lewis 貸款服務',
      nameEn: 'Damon Lewis Loan Services',
      emoji: '📋',
      description: 'Damon Lewis 貸款服務，提供商業貸款、企業融資及資金周轉方案，佣金另議。',
      descriptionEn: 'Damon Lewis loan services providing commercial loans, enterprise financing and cash flow solutions. Commission negotiable.',
      category: 'corporate',
      priceMin: 0,
      priceMax: 0,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 0,
      commissionNegotiable: true,
      status: 'active',
    },
    {
      name: 'Damon Lewis Plan D.2 (公司秘書+會計稅務+公司成立)',
      nameEn: 'Damon Lewis Plan D.2 (Secretary+Accounting+Formation)',
      emoji: '📋',
      description: 'Damon Lewis Plan D.2 套裝，包含公司秘書服務、會計及稅務、公司成立與合規三大服務。',
      descriptionEn: 'Damon Lewis Plan D.2 package including company secretary, accounting & tax, and company formation & compliance.',
      category: 'corporate',
      priceMin: 29800,
      priceMax: 29800,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 0,
      commissionNegotiable: true,
      status: 'active',
    },
    {
      name: 'Damon Lewis Plan D.3 (公司秘書+公司成立+融資顧問+BUD基金)',
      nameEn: 'Damon Lewis Plan D.3 (Secretary+Formation+Financing+BUD)',
      emoji: '📋',
      description: 'Damon Lewis Plan D.3 套裝，包含公司秘書服務、公司成立與合規、中小企融資顧問及BUD專項基金申請四大服務。',
      descriptionEn: 'Damon Lewis Plan D.3 package including company secretary, company formation, SME financing advisory and BUD Fund application.',
      category: 'corporate',
      priceMin: 39998,
      priceMax: 39998,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 0,
      commissionNegotiable: true,
      status: 'active',
    },
  ],
  '家族信託': [
    {
      name: '設立香港家族信託',
      nameEn: 'Set Up Hong Kong Family Trust',
      emoji: '🏦',
      description: '設立香港家族信託架構，實現資產保護、財富傳承及稅務優化。涵蓋信託契約起草、受託人安排、資產注入及合規申報等全套服務，收費HK$4,500,000起，佣金另議。',
      descriptionEn: 'Set up a Hong Kong family trust structure for asset protection, wealth succession and tax optimization. Full service including trust deed drafting, trustee arrangement, asset injection and compliance. HK$4,500,000 or more, commission negotiable.',
      category: 'trust',
      priceMin: 4500000,
      priceMax: 4500000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 0,
      commissionNegotiable: true,
      status: 'active',
    },
  ],
  '聖多美公民計劃/日本高度人才套裝': [
    {
      name: '聖多美公民身份',
      nameEn: 'STP Citizenship',
      emoji: '🇸🇹',
      description: '聖多美及普林西比投資入籍計劃，快速審批、免簽多國，助力全球資產配置及出行便利。非CRS管轄區，4代覆蓋，完整公民身份。',
      descriptionEn: 'São Tomé and Príncipe investment citizenship program. Fast approval, visa-free access, non-CRS jurisdiction, 4-generation coverage.',
      category: 'immigration',
      priceMin: 1000000,
      priceMax: 1000000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 60000,
      status: 'active',
    },
    {
      name: '日本經營管理者簽/首次設定',
      nameEn: 'STP Japan Business Manager Visa Setup',
      emoji: '🇯🇵',
      description: '聖多美公民申請日本經營管理者簽證首次設定全套服務，包含在留資格申請、住址登記、銀行開戶等首次設定，一站式解決落地需求。',
      descriptionEn: 'Full setup service for STP citizens applying for Japan Business Manager visa. Includes residency application, address registration, bank account opening.',
      category: 'immigration',
      priceMin: 150000,
      priceMax: 150000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 40000,
      status: 'active',
    },
    {
      name: '經營管理者續簽',
      nameEn: 'STP Business Manager Visa Renewal',
      emoji: '🇯🇵',
      description: '日本經營管理者簽證續期及年度管理套裝，包含在留期間更新、住址變更登記、稅務申報協助等，確保持續合規在留。',
      descriptionEn: 'Japan Business Manager visa renewal and annual management package. Includes residency renewal, address change registration, tax filing assistance.',
      category: 'immigration',
      priceMin: 30000,
      priceMax: 30000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 8000,
      status: 'active',
    },
    {
      name: '日本高度人才套裝/首次設定',
      nameEn: 'STP Japan Highly Skilled Professional Setup',
      emoji: '🇯🇵',
      description: '聖多美公民申請日本高度人才簽證全套服務，包含資格評估、文件準備、申請遞交及後續跟進，最快1年可申請永住。',
      descriptionEn: 'Full service for STP citizens applying for Japan Highly Skilled Professional visa. Includes assessment, document preparation, application and follow-up.',
      category: 'immigration',
      priceMin: 350000,
      priceMax: 350000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 80000,
      status: 'active',
    },
    {
      name: '高度人才套裝',
      nameEn: 'STP Highly Skilled Professional Package',
      emoji: '🇯🇵',
      description: '日本高度人才簽證續期及年度管理套裝，包含積分更新評估、續期申請、稅務規劃協助等，確保簽證持續有效。',
      descriptionEn: 'Japan HSP visa renewal and annual management. Includes points recalculation, renewal application, tax planning assistance.',
      category: 'immigration',
      priceMin: 50000,
      priceMax: 50000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 12000,
      status: 'active',
    },
  ],
  '樂天證券黃金CFD交易服務': [
    {
      name: 'Standard Gold CFD Trading Account',
      nameEn: 'Standard Gold CFD Trading Account',
      emoji: '🥇',
      description: '標準黃金CFD交易賬戶，最低開戶存款2,000港元，享受樂天證券黃金專業交易平台、實時市場報價及低點差交易體驗。適合初學者及中級黃金投資者，提供完善的教育資源及客戶支援。',
      descriptionEn: 'Standard Gold CFD trading account with minimum opening deposit of HKD 2,000. Access to Rakuten Securities Bullion professional trading platform, real-time market quotes, and tight spreads. Suitable for beginners and intermediate gold investors with comprehensive educational resources and customer support.',
      category: 'investment',
      priceMin: 2000,
      priceMax: 100000,
      currency: 'HKD',
      commissionRate: 0,
      commissionFixed: 0,
      commissionNegotiable: true,
      status: 'active',
    },
  ],
};

const SAMPLE_USERS = [
  { email: 'admin@mclub.com', name: 'MCLUB Admin', role: 'admin', password: 'admin123' },
  { email: 'chan@mypath.hk', name: '陳志明', role: 'director', password: 'director123' },
  { email: 'lee@mypath.hk', name: '李美琪', role: 'director', password: 'director123' },
  { email: 'wong@mypath.hk', name: '黃偉業', role: 'director', password: 'director123' },
  { email: 'bosco@mclub.com', name: 'Bosco', role: 'director', password: 'demo123' },
  { email: 'damon@mclub.com', name: 'Damon Lewis', role: 'director', password: 'demo123' },
];

const SAMPLE_CUSTOMERS = [
  { name: '張偉豪', email: 'cheung@gmail.com', phone: '+852 9123 4567', company: '偉豪投資有限公司', nationality: 'HK', status: 'active' },
  { name: 'Emily Chen', email: 'emily.chen@yahoo.com', phone: '+852 9876 5432', company: 'Chen Holdings Ltd', nationality: 'HK', status: 'active' },
  { name: '林大衛', email: 'david.lin@outlook.com', phone: '+852 6789 0123', company: null, nationality: 'TW', status: 'prospect' },
  { name: 'Sarah Wong', email: 'sarah.wong@gmail.com', phone: '+852 5432 1098', company: 'Wong Family Office', nationality: 'HK', status: 'active' },
  { name: '吳建國', email: 'wu.jianguo@163.com', phone: '+86 138 0000 1234', company: '吳氏集團', nationality: 'CN', status: 'active' },
];

const SAMPLE_EVENTS = [
  { title: 'MCLUB 2026 夏季投資論壇', description: '探討家族辦公室資產配置策略，邀請行業專家分享市場見解', type: 'seminar', date: '2026-07-15T14:00:00', location: '香港四季酒店宴會廳', maxAttendees: 50, status: 'upcoming' },
  { title: '日本物業投資說明會', description: '大阪物業投資機會深度解析，6%租金保證方案', type: 'webinar', date: '2026-07-22T10:00:00', location: '線上 Zoom 會議', maxAttendees: 30, status: 'upcoming' },
  { title: 'VFK健康產品體驗日', description: '產品試用及健康諮詢，會員專享', type: 'training', date: '2026-08-05T15:00:00', location: 'MCLUB會所', maxAttendees: 20, status: 'upcoming' },
];

const SAMPLE_ORDERS = [
  { customerIndex: 0, productIndex: 0, directorIndex: 1, status: 'completed', amount: 8500000, currency: 'JPY', notes: '東京新宿區住宅單位' },
  { customerIndex: 1, productIndex: 3, directorIndex: 1, status: 'processing', amount: 200000, currency: 'HKD', notes: '離岸信託設立' },
  { customerIndex: 3, productIndex: 1, directorIndex: 2, status: 'pending', amount: 200000, currency: 'USD', notes: '聖多美投資入籍申請' },
  { customerIndex: 2, productIndex: 5, directorIndex: 2, status: 'completed', amount: 12000, currency: 'HKD', notes: 'MyPath AI 年度訂閱' },
  { customerIndex: 4, productIndex: 2, directorIndex: 1, status: 'completed', amount: 5000000, currency: 'HKD', notes: 'NPC基金投資' },
  { customerIndex: 4, productIndex: 7, directorIndex: 1, status: 'processing', amount: 88000, currency: 'HKD', notes: '家族辦公室認可證書課程報名' },
  { customerIndex: 1, productIndex: 6, directorIndex: 2, status: 'pending', amount: 150000, currency: 'HKD', notes: '企業合併法律顧問服務' },
];

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await db.notification.deleteMany();
  await db.notice.deleteMany();
  await db.eventParticipant.deleteMany();
  await db.eventRegistration.deleteMany();
  await db.event.deleteMany();
  await db.commission.deleteMany();
  await db.order.deleteMany();
  await db.customer.deleteMany();
  await db.product.deleteMany();
  await db.user.deleteMany();

  // Create users
  console.log('Creating users...');
  const users: any[] = [];
  for (const u of SAMPLE_USERS) {
    const hashedPassword = await hash(u.password, 10);
    const user = await db.user.create({
      data: { email: u.email, name: u.name, role: u.role, password: hashedPassword },
    });
    users.push(user);
  }

  // Create parent products
  console.log('Creating parent products...');
  const products: any[] = [];
  for (const p of PARENT_PRODUCTS) {
    const product = await db.product.create({ data: p });
    products.push(product);
  }

  // Create sub-products (children)
  console.log('Creating sub-products...');
  for (const product of products) {
    const children = SUB_PRODUCTS[product.name];
    if (children) {
      for (const child of children) {
        const subProduct = await db.product.create({
          data: { ...child, parentId: product.id },
        });
        products.push(subProduct);
      }
    }
  }

  // Create customers
  console.log('Creating customers...');
  const customers: any[] = [];
  for (const c of SAMPLE_CUSTOMERS) {
    const customer = await db.customer.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        nationality: c.nationality,
        status: c.status,
        referrerId: users[Math.floor(Math.random() * 2) + 1].id, // random director
      },
    });
    customers.push(customer);
  }

  // Create orders
  console.log('Creating orders...');
  for (const o of SAMPLE_ORDERS) {
    const product = products[o.productIndex];
    const commissionAmount = o.amount * (product.commissionRate / 100);
    const order = await db.order.create({
      data: {
        customerId: customers[o.customerIndex].id,
        productId: product.id,
        directorId: users[o.directorIndex].id,
        status: o.status,
        amount: o.amount,
        currency: o.currency,
        commission: commissionAmount,
        notes: o.notes,
      },
    });

    // Create commission for completed/processing orders
    if (o.status === 'completed') {
      await db.commission.create({
        data: {
          directorId: users[o.directorIndex].id,
          orderId: order.id,
          amount: commissionAmount,
          currency: o.currency,
          status: 'paid',
          paidAt: new Date(),
        },
      });
    } else if (o.status === 'processing') {
      await db.commission.create({
        data: {
          directorId: users[o.directorIndex].id,
          orderId: order.id,
          amount: commissionAmount,
          currency: o.currency,
          status: 'pending',
        },
      });
    }
  }

  // Create events
  console.log('Creating events...');
  for (const e of SAMPLE_EVENTS) {
    const event = await db.event.create({
      data: {
        title: e.title,
        description: e.description,
        type: e.type,
        date: new Date(e.date),
        location: e.location,
        maxAttendees: e.maxAttendees,
        status: e.status,
      },
    });

    // Add some participants
    for (let i = 1; i <= 2; i++) {
      await db.eventParticipant.create({
        data: {
          eventId: event.id,
          userId: users[i].id,
          status: 'registered',
        },
      });
    }
  }

  // Create notices
  console.log('Creating notices...');
  const notices = [
    {
      title: '系統升級通知',
      content: 'MCLUB CRM已升級至v3.0版本，新增JWT認證、分頁功能及客戶詳情頁面。',
      category: 'announcement',
      targetRoles: 'admin,director',
      authorId: users[0].id,
      isPinned: true,
      isActive: true,
    },
    {
      title: '夏季投資論壇報名開放',
      content: 'MCLUB 2026夏季投資論壇現已接受報名，名額有限，先到先得。',
      category: 'announcement',
      targetRoles: 'admin,director',
      authorId: users[0].id,
      isPinned: false,
      isActive: true,
    },
    {
      title: '合規政策更新',
      content: '請所有總監務必閱讀最新的KYC/AML合規政策，於2026年7月1日前完成培訓。',
      category: 'policy',
      targetRoles: 'director',
      authorId: users[0].id,
      isPinned: true,
      isActive: true,
    },
  ];
  for (const n of notices) {
    await db.notice.create({ data: n });
  }

  // Create notifications
  console.log('Creating notifications...');
  const notifications = [
    { userId: users[1].id, title: '新訂單通知', message: '張偉豪的日本物業訂單已完成處理', type: 'success' },
    { userId: users[2].id, title: '活動提醒', message: '日本物業投資講座將於7月15日舉行', type: 'info' },
    { userId: users[1].id, title: '佣金已到帳', message: 'NPC基金訂單佣金 HK$250,000 已入帳', type: 'success' },
    { userId: users[3].id, title: '新客戶推薦', message: '林大衛已被添加為潛在客戶', type: 'info' },
    { userId: users[1].id, title: '課程報名', message: '吳建國已報名家族辦公室專業認可證書課程', type: 'info' },
  ];
  for (const n of notifications) {
    await db.notification.create({ data: n });
  }

  console.log('✅ Seed completed successfully!');
  console.log(`   - ${users.length} users created`);
  console.log(`   - ${products.length} products created`);
  console.log(`   - ${customers.length} customers created`);
  console.log(`   - ${SAMPLE_ORDERS.length} orders created`);
  console.log(`   - ${SAMPLE_EVENTS.length} events created`);
  console.log(`   - ${notices.length} notices created`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
