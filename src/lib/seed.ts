import { db } from './db';
import { hash } from 'bcrypt';

const PRODUCTS = [
  {
    name: '日本物業投資',
    nameEn: 'Japan Property Investment',
    emoji: '🏘️',
    description: '為客戶提供日本優質物業投資機會，涵蓋東京、大阪等主要城市住宅及商業物業。專業團隊提供選址分析、貸款安排、物業管理一站式服務。',
    descriptionEn: 'Premium Japanese property investment opportunities in Tokyo, Osaka and major cities. Professional team provides location analysis, financing, and property management.',
    category: 'investment',
    priceMin: 500000,
    priceMax: 20000000,
    currency: 'JPY',
    commissionRate: 3.0,
    status: 'active',
  },
  {
    name: '聖多美公民計劃',
    nameEn: 'São Tomé and Príncipe Citizenship',
    emoji: '🇸🇹',
    description: '透過聖多美及普林西比投資入籍計劃，為客戶提供第二護照解決方案。快速審批、免簽多國，助力全球資產配置及出行便利。',
    descriptionEn: 'Second passport solution through São Tomé and Príncipe investment citizenship program. Fast approval, visa-free access to many countries.',
    category: 'immigration',
    priceMin: 150000,
    priceMax: 250000,
    currency: 'USD',
    commissionRate: 10.0,
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
    priceMax: 10000000,
    currency: 'HKD',
    commissionRate: 5.0,
    status: 'active',
  },
  {
    name: '家族信託',
    nameEn: 'Family Trust',
    emoji: '🏦',
    description: '為高淨值家族設立信託架構，實現資產保護、財富傳承及稅務優化。涵蓋離岸信託、目的信託等多種方案。',
    descriptionEn: 'Establish trust structures for high-net-worth families for asset protection, wealth succession and tax optimization. Includes offshore and purpose trust solutions.',
    category: 'trust',
    priceMin: 50000,
    priceMax: 500000,
    currency: 'HKD',
    commissionRate: 8.0,
    status: 'active',
  },
  {
    name: '公司秘書服務',
    nameEn: 'Company Secretary Service',
    emoji: '📋',
    description: '提供專業公司秘書及合規服務，包括公司註冊、年審、會計記帳、稅務申報等。確保企業持續合規營運。',
    descriptionEn: 'Professional company secretary and compliance services including incorporation, annual returns, accounting, and tax filing. Ensure ongoing corporate compliance.',
    category: 'corporate',
    priceMin: 5000,
    priceMax: 80000,
    currency: 'HKD',
    commissionRate: 15.0,
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
    priceMin: 38000,
    priceMax: 128000,
    currency: 'HKD',
    commissionRate: 18.0,
    status: 'active',
  },
];

const SAMPLE_USERS = [
  { email: 'admin@mclub.com', name: 'MCLUB Admin', role: 'admin', password: 'admin123' },
  { email: 'chan@mypath.hk', name: '陳志明', role: 'agent', password: 'agent123' },
  { email: 'lee@mypath.hk', name: '李美琪', role: 'agent', password: 'agent123' },
  { email: 'wong@mypath.hk', name: '黃偉業', role: 'sme', password: 'sme123' },
];

const SAMPLE_CUSTOMERS = [
  { name: '張偉豪', email: 'cheung@gmail.com', phone: '+852 9123 4567', company: '偉豪投資有限公司', nationality: 'HK', status: 'active' },
  { name: 'Emily Chen', email: 'emily.chen@yahoo.com', phone: '+852 9876 5432', company: 'Chen Holdings Ltd', nationality: 'HK', status: 'active' },
  { name: '林大衛', email: 'david.lin@outlook.com', phone: '+852 6789 0123', company: null, nationality: 'TW', status: 'prospect' },
  { name: 'Sarah Wong', email: 'sarah.wong@gmail.com', phone: '+852 5432 1098', company: 'Wong Family Office', nationality: 'HK', status: 'active' },
  { name: '吳建國', email: 'wu.jianguo@163.com', phone: '+86 138 0000 1234', company: '吳氏集團', nationality: 'CN', status: 'active' },
];

const SAMPLE_EVENTS = [
  { title: '日本物業投資講座 2025', description: '深入分析東京及大阪物業市場最新趨勢及投資機會', type: 'seminar', date: '2025-07-15T14:00:00', location: '香港中環皇后大道中68號', maxAttendees: 50, status: 'upcoming' },
  { title: 'NPC基金季度回顧', description: '第二季基金表現分析及第三季展望', type: 'webinar', date: '2025-07-20T10:00:00', location: '線上 Zoom', maxAttendees: 100, status: 'upcoming' },
  { title: '家族信託法律研討會', description: '探討最新信託法例修訂對家族財富傳承的影響', type: 'seminar', date: '2025-08-05T15:00:00', location: '香港金鐘海富中心', maxAttendees: 30, status: 'upcoming' },
];

const SAMPLE_ORDERS = [
  { customerIndex: 0, productIndex: 0, agentIndex: 1, status: 'completed', amount: 8500000, currency: 'JPY', notes: '東京新宿區住宅單位' },
  { customerIndex: 1, productIndex: 3, agentIndex: 1, status: 'processing', amount: 200000, currency: 'HKD', notes: '離岸信託設立' },
  { customerIndex: 3, productIndex: 1, agentIndex: 2, status: 'pending', amount: 200000, currency: 'USD', notes: '聖多美投資入籍申請' },
  { customerIndex: 2, productIndex: 5, agentIndex: 2, status: 'completed', amount: 12000, currency: 'HKD', notes: 'MyPath AI 年度訂閱' },
  { customerIndex: 4, productIndex: 2, agentIndex: 1, status: 'completed', amount: 5000000, currency: 'HKD', notes: 'NPC基金投資' },
  { customerIndex: 4, productIndex: 7, agentIndex: 1, status: 'processing', amount: 88000, currency: 'HKD', notes: '家族辦公室認可證書課程報名' },
  { customerIndex: 1, productIndex: 6, agentIndex: 2, status: 'pending', amount: 150000, currency: 'HKD', notes: '企業合併法律顧問服務' },
];

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await db.notification.deleteMany();
  await db.notice.deleteMany();
  await db.eventParticipant.deleteMany();
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

  // Create products
  console.log('Creating products...');
  const products: any[] = [];
  for (const p of PRODUCTS) {
    const product = await db.product.create({ data: p });
    products.push(product);
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
        referrerId: users[Math.floor(Math.random() * 2) + 1].id, // random agent
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
        agentId: users[o.agentIndex].id,
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
          agentId: users[o.agentIndex].id,
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
          agentId: users[o.agentIndex].id,
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
      title: 'MCLUB系統維護通知',
      content: '系統將於2025年7月20日（星期日）凌晨2:00至6:00進行例行維護。屆時系統將暫時無法訪問，請提前做好相關安排。維護完成後系統將自動恢復正常運行。如有疑問，請聯繫IT支援團隊。',
      category: 'announcement',
      targetRoles: 'admin,sme,agent,client',
      authorId: users[0].id,
      isPinned: true,
      isActive: true,
    },
    {
      title: '緊急：佣金發放流程變更',
      content: '即日起，所有佣金發放申請需附上客戶簽署確認書方可處理。請各代理確保在提交佣金申求前，已取得客戶的書面確認。詳情請參閱更新後的佣金管理手冊，或聯繫財務部門查詢。',
      category: 'urgent',
      targetRoles: 'admin,sme,agent',
      authorId: users[0].id,
      isPinned: false,
      isActive: true,
    },
    {
      title: '2025年第三季度KPI調整',
      content: '經管理層審議，2025年第三季度的KPI指標將進行以下調整：\n1. 新增客戶數量目標：每代理每月不少於3名新客\n2. 客戶滿意度目標：維持在90%以上\n3. 產品成交轉化率目標：提升至15%\n4. 活動參與率目標：每月至少參加1場活動\n\n新的KPI將於7月1日正式生效，請各位同事先做好準備。',
      category: 'policy',
      targetRoles: 'admin,sme,agent',
      authorId: users[0].id,
      isPinned: false,
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
