import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return hash.toString(36);
}

export async function POST() {
  try {
    // Check if already seeded
    const existing = await db.user.count();
    if (existing > 0) {
      return NextResponse.json({ message: '數據已初始化', count: existing });
    }

    const pw = simpleHash('demo123');

    // Create users
    const kenneth = await db.user.create({ data: { email: 'kenneth@parkzeman.com', password: pw, name: 'Kenneth Mak', role: 'MCLUB_STAFF', phone: '+85262277662' } });
    const calvin = await db.user.create({ data: { email: 'calvin@mclub.com', password: pw, name: 'Calvin Chu', role: 'SME_OWNER' } });
    const nomura = await db.user.create({ data: { email: 'nomura@mclub.com', password: pw, name: '野村至紀', role: 'SME_OWNER' } });
    const bosco = await db.user.create({ data: { email: 'bosco@mclub.com', password: pw, name: 'Bosco Leung', role: 'SME_OWNER' } });
    const damon = await db.user.create({ data: { email: 'damon@mclub.com', password: pw, name: 'Damon Lewis', role: 'SME_OWNER' } });
    const agent = await db.user.create({ data: { email: 'agent@mclub.com', password: pw, name: '陳先生', role: 'AGENT', phone: '+85291234567' } });
    const endUser = await db.user.create({ data: { email: 'user@mclub.com', password: pw, name: '李太太', role: 'END_USER', referredById: agent.id, phone: '+8613812345678' } });
    const endUser2 = await db.user.create({ data: { email: 'wang@mclub.com', password: pw, name: '王總', role: 'END_USER', referredById: agent.id, phone: '+8613987654321' } });

    // Create products
    const vfk = await db.product.create({ data: { name: 'VFK健康產品', category: '健康', description: '模塊化成功藍圖，Plan A/B/C三級會員制', keyPoints: '["臨床實證-33%內臟脂肪","1BV=$8HKD","7層獎金制度"]', minInvestment: 'HK$4,800', smeOwnerId: calvin.id, commissionRules: '{"agentRate":15,"smeRate":40,"mclubRate":45,"type":"percent"}', icon: '💊', color: '#e74c3c' } });
    const jpProp = await db.product.create({ data: { name: '日本物業投資', category: '物業', description: '大阪物業6%租金保證，高度人才簽證→1年永住', keyPoints: '["6%租金保證","94.2%入住率","高度人才簽證"]', minInvestment: 'HK$300萬', smeOwnerId: nomura.id, commissionRules: '{"agentRate":3,"smeRate":50,"mclubRate":47,"type":"percent"}', icon: '🏘️', color: '#f39c12' } });
    const citizen = await db.product.create({ data: { name: '聖多美公民計劃', category: '身份', description: '非CRS管轄區，4代覆蓋，$90K USD', keyPoints: '["非CRS管轄區","4代覆蓋","全球稀缺"]', minInvestment: 'US$90,000', smeOwnerId: bosco.id, commissionRules: '{"agentRate":8,"smeRate":35,"mclubRate":57,"type":"percent"}', icon: '🇸🇹', color: '#1abc9c' } });
    const npcFund = await db.product.create({ data: { name: 'NPC基金', category: '基金', description: '源石資本有限合夥基金，8%-35%回報', keyPoints: '["SFC 4/5/9牌照","8%門檻回報","大阪物業雙引擎"]', minInvestment: 'US$100,000', smeOwnerId: bosco.id, commissionRules: '{"agentRate":2,"smeRate":50,"mclubRate":48,"type":"percent"}', icon: '📈', color: '#27ae60' } });
    const trust = await db.product.create({ data: { name: '家族信託', category: '信託', description: '香港信託設立，CRS合規架構', keyPoints: '["無遺產稅","無資本增值稅","CRS合規"]', minInvestment: 'HK$450萬', smeOwnerId: bosco.id, commissionRules: '{"agentRate":4,"smeRate":45,"mclubRate":51,"type":"percent"}', icon: '🏦', color: '#8e44ad' } });
    await db.product.create({ data: { name: '公司秘書服務', category: '企業', description: '會計稅務、成立公司、政府補貼', keyPoints: '["年費模式","政府BUD/TVPS補貼","SME融資"]', minInvestment: 'HK$6,000/年', smeOwnerId: damon.id, commissionRules: '{"agentRate":15,"smeRate":50,"mclubRate":35,"type":"percent"}', icon: '📋', color: '#7f8c8d' } });
    await db.product.create({ data: { name: 'MyPath AI', category: '科技', description: 'AI智能旅遊管家，日本行程規劃', keyPoints: '["1,570萬中國訪日旅客","Gemini雙層AI","O2O2O閉環"]', minInvestment: '免費', smeOwnerId: kenneth.id, commissionRules: '{"agentRate":5,"smeRate":0,"mclubRate":95,"type":"percent"}', icon: '📱', color: '#2980b9' } });

    // Create clients
    const client1 = await db.client.create({ data: { name: '李太太', phone: '+8613812345678', email: 'user@mclub.com', source: 'Agent推薦', memberLevel: 'PLAN_A', agentId: agent.id, totalSpent: 4800 } });
    const client2 = await db.client.create({ data: { name: '王總', phone: '+8613987654321', email: 'wang@mclub.com', source: 'Agent推薦', memberLevel: 'PLAN_C', agentId: agent.id, totalSpent: 29800 } });

    // Create sample orders
    const order1 = await db.order.create({ data: { productId: vfk.id, endUserId: endUser.id, clientId: client1.id, agentId: agent.id, status: 'COMPLETED', amount: 4800, currency: 'HKD' } });
    const order2 = await db.order.create({ data: { productId: npcFund.id, endUserId: endUser2.id, clientId: client2.id, agentId: agent.id, status: 'PENDING', amount: 100000, currency: 'USD' } });
    const order3 = await db.order.create({ data: { productId: jpProp.id, endUserId: endUser2.id, clientId: client2.id, agentId: agent.id, status: 'IN_PROGRESS', amount: 3000000, currency: 'HKD' } });

    // Create timeline events
    await db.timelineEvent.createMany({ data: [
      { clientId: client1.id, orderId: order1.id, eventType: 'purchase', title: '購買VFK Plan A', description: '通過Agent陳先生推薦加入', createdById: agent.id },
      { clientId: client2.id, orderId: order3.id, eventType: 'purchase', title: '購買日本物業', description: '大阪物業投資，6%租金保證', createdById: agent.id },
      { clientId: client2.id, orderId: order2.id, eventType: 'purchase', title: '申請NPC基金認購', description: 'US$100,000認購，待確認', createdById: agent.id },
      { clientId: client1.id, eventType: 'note', title: '跟進備註', description: '客戶對升級Plan B有興趣，下週再跟進', createdById: agent.id },
    ] });

    // Create commissions for settled order
    await db.commission.createMany({ data: [
      { orderId: order1.id, recipientId: agent.id, role: 'AGENT', amount: 720, status: 'PAID' },
      { orderId: order1.id, recipientId: calvin.id, role: 'SME_OWNER', amount: 1920, status: 'PAID' },
    ] });

    // Create sample events
    const event1 = await db.clubEvent.create({
      data: {
        title: 'MCLUB 2026 夏季投資論壇',
        description: '探討家族辦公室資產配置策略，邀請行業專家分享市場見解',
        category: 'seminar',
        venue: '香港四季酒店宴會廳',
        eventDate: new Date('2026-07-15T14:00:00'),
        endDate: new Date('2026-07-15T18:00:00'),
        status: 'PUBLISHED',
        maxAttendees: 50,
        isPublic: true,
        fee: 0,
        currency: 'HKD',
        contactPerson: 'Kenneth Mak',
        sponsor: '野村資本',
        createdById: kenneth.id,
      },
    });
    const event2 = await db.clubEvent.create({
      data: {
        title: '日本物業投資說明會',
        description: '大阪物業投資機會深度解析，6%租金保證方案',
        category: 'seminar',
        venue: '線上 Zoom 會議',
        eventDate: new Date('2026-07-22T10:00:00'),
        endDate: new Date('2026-07-22T12:00:00'),
        status: 'PUBLISHED',
        maxAttendees: 30,
        isPublic: true,
        fee: 0,
        currency: 'HKD',
        contactPerson: '野村至紀',
        createdById: kenneth.id,
      },
    });
    const event3 = await db.clubEvent.create({
      data: {
        title: 'VFK健康產品體驗日',
        description: '產品試用及健康諮詢，Plan A/B/C會員專享',
        category: 'workshop',
        venue: 'MCLUB會所',
        eventDate: new Date('2026-08-05T15:00:00'),
        endDate: new Date('2026-08-05T17:30:00'),
        status: 'DRAFT',
        maxAttendees: 20,
        isPublic: false,
        fee: 200,
        currency: 'HKD',
        contactPerson: 'Calvin Chu',
        sponsor: 'VFK Health',
        createdById: kenneth.id,
      },
    });

    // Create sample RSVPs
    await db.rSVP.createMany({
      data: [
        { eventId: event1.id, userId: agent.id, status: 'CONFIRMED', guests: 1 },
        { eventId: event1.id, userId: endUser.id, status: 'PENDING', guests: 0 },
        { eventId: event2.id, userId: agent.id, status: 'CONFIRMED', guests: 0 },
        { eventId: event2.id, userId: endUser2.id, status: 'CONFIRMED', guests: 2 },
      ],
    });

    // Create sample event tasks
    await db.eventTask.createMany({
      data: [
        { eventId: event1.id, title: '預訂場地', description: '四季酒店宴會廳預訂確認', status: 'DONE', priority: 'high', dueDate: new Date('2026-06-15'), assigneeId: kenneth.id },
        { eventId: event1.id, title: '邀請演講嘉賓', description: '確認3位行業專家出席', status: 'IN_PROGRESS', priority: 'high', dueDate: new Date('2026-07-01'), assigneeId: kenneth.id },
        { eventId: event1.id, title: '準備宣傳物料', description: '海報、邀請函、社交媒體素材', status: 'TODO', priority: 'medium', dueDate: new Date('2026-07-05') },
        { eventId: event1.id, title: '安排餐飲服務', description: '茶點及雞尾酒安排', status: 'TODO', priority: 'medium', dueDate: new Date('2026-07-10') },
        { eventId: event1.id, title: '影音設備測試', description: '投影、音響、直播設備', status: 'TODO', priority: 'low', dueDate: new Date('2026-07-14') },
        { eventId: event3.id, title: '準備產品試用裝', description: 'VFK產品試用包裝', status: 'TODO', priority: 'high', dueDate: new Date('2026-08-01') },
      ],
    });

    // Create sample budget items
    await db.eventBudgetItem.createMany({
      data: [
        { eventId: event1.id, category: 'venue', description: '四季酒店宴會廳租金', estimatedCost: 50000, actualCost: 48000 },
        { eventId: event1.id, category: 'catering', description: '茶點及雞尾酒', estimatedCost: 15000, actualCost: null },
        { eventId: event1.id, category: 'av', description: '影音設備租賃', estimatedCost: 8000, actualCost: null },
        { eventId: event1.id, category: 'marketing', description: '宣傳物料及社交媒體推廣', estimatedCost: 5000, actualCost: 3200 },
        { eventId: event1.id, category: 'staff', description: '臨時工作人員', estimatedCost: 6000, actualCost: null },
        { eventId: event1.id, category: 'other', description: '紀念品及文具', estimatedCost: 3000, actualCost: null },
      ],
    });

    // ── FX Risk Seed Data ──

    // Currency rates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await db.currencyRate.createMany({
      data: [
        { fromCurrency: 'USD', toCurrency: 'HKD', rate: 7.82, source: 'demo', date: today },
        { fromCurrency: 'USD', toCurrency: 'JPY', rate: 155.5, source: 'demo', date: today },
        { fromCurrency: 'USD', toCurrency: 'RMB', rate: 7.25, source: 'demo', date: today },
      ],
    });

    // FX Stress tests
    const stressTest1 = await db.fXStressTest.create({
      data: {
        userId: endUser2.id,
        portfolio: JSON.stringify([
          { productId: 'demo1', productName: '香港物業', currency: 'HKD', amount: 5000000, weight: 0.5 },
          { productId: 'demo2', productName: 'NPC基金', currency: 'USD', amount: 200000, weight: 0.2 },
          { productId: 'demo3', productName: '日本物業', currency: 'JPY', amount: 50000000, weight: 0.2 },
          { productId: 'demo4', productName: 'VFK健康產品', currency: 'RMB', amount: 3000000, weight: 0.1 },
        ]),
        baseCurrency: 'HKD',
        results: JSON.stringify({
          mild: { totalLoss: 378000, lossPercent: '2.5', items: [{ currency: 'USD', loss: 78200, percent: 5 }, { currency: 'JPY', loss: 251500, percent: 5 }, { currency: 'RMB', loss: 48300, percent: 5 }] },
          moderate: { totalLoss: 1134000, lossPercent: '7.5', items: [{ currency: 'USD', loss: 234600, percent: 15 }, { currency: 'JPY', loss: 754500, percent: 15 }, { currency: 'RMB', loss: 144900, percent: 15 }] },
          extreme: { totalLoss: 2268000, lossPercent: '15.0', items: [{ currency: 'USD', loss: 469200, percent: 30 }, { currency: 'JPY', loss: 1509000, percent: 30 }, { currency: 'RMB', loss: 289800, percent: 30 }] },
        }),
        totalAssetValue: 15120000,
        maxLossAmount: 2268000,
      },
    });

    const stressTest2 = await db.fXStressTest.create({
      data: {
        userId: endUser.id,
        portfolio: JSON.stringify([
          { productId: 'demo1', productName: 'VFK健康產品', currency: 'RMB', amount: 500000, weight: 0.6 },
          { productId: 'demo2', productName: '日本物業', currency: 'JPY', amount: 10000000, weight: 0.4 },
        ]),
        baseCurrency: 'HKD',
        results: JSON.stringify({
          mild: { totalLoss: 91700, lossPercent: '2.5', items: [{ currency: 'RMB', loss: 16125, percent: 5 }, { currency: 'JPY', loss: 75575, percent: 5 }] },
          moderate: { totalLoss: 275100, lossPercent: '7.5', items: [{ currency: 'RMB', loss: 48375, percent: 15 }, { currency: 'JPY', loss: 226725, percent: 15 }] },
          extreme: { totalLoss: 550200, lossPercent: '15.0', items: [{ currency: 'RMB', loss: 96750, percent: 30 }, { currency: 'JPY', loss: 453450, percent: 30 }] },
        }),
        totalAssetValue: 3668000,
        maxLossAmount: 550200,
      },
    });

    // Currency alerts
    await db.currencyAlert.createMany({
      data: [
        { userId: endUser2.id, fromCurrency: 'JPY', toCurrency: 'HKD', threshold: 5.0, direction: 'down', status: 'ACTIVE' },
        { userId: endUser2.id, fromCurrency: 'USD', toCurrency: 'RMB', threshold: 3.0, direction: 'down', status: 'ACTIVE' },
        { userId: endUser.id, fromCurrency: 'JPY', toCurrency: 'USD', threshold: 10.0, direction: 'down', status: 'TRIGGERED', triggeredAt: new Date() },
      ],
    });

    // Hedging matches
    await db.hedgingMatch.create({
      data: {
        userId: endUser2.id,
        stressTestId: stressTest1.id,
        hedgingType: 'forward',
        fromCurrency: 'JPY',
        toCurrency: 'HKD',
        amount: 50000000,
        status: 'PENDING',
        matchedProvider: JSON.stringify({ name: '匯豐銀行', type: 'bank', contact: '+852-2233-3322' }),
        quote: JSON.stringify({ rate: 0.0503, fee: 50000, expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }),
        commissionRate: 0.5,
        commissionAmount: 250000,
        notes: '對沖日圓下跌風險',
      },
    });

    await db.hedgingMatch.create({
      data: {
        userId: endUser2.id,
        stressTestId: stressTest1.id,
        hedgingType: 'option',
        fromCurrency: 'USD',
        toCurrency: 'HKD',
        amount: 200000,
        status: 'MATCHED',
        matchedProvider: JSON.stringify({ name: '中銀香港', type: 'bank', contact: '+852-2853-3322' }),
        quote: JSON.stringify({ rate: 7.82, fee: 200, expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() }),
        commissionRate: 0.3,
        commissionAmount: 600,
        notes: '美元看跌期權保護',
      },
    });

    return NextResponse.json({ message: '數據初始化成功', users: 8, products: 7, clients: 2, orders: 3 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
