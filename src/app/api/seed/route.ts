import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { requireAuth, requireRole } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    // Check if already seeded first
    const existing = await db.user.count();
    if (existing > 0) {
      // If DB has users, require admin auth to re-seed
      const auth = requireAuth(request);
      if (auth instanceof NextResponse) return auth;
      const roleCheck = requireRole(auth, 'admin');
      if (roleCheck instanceof NextResponse) return roleCheck;
      return NextResponse.json({ message: '數據已初始化', count: existing });
    }
    // Allow unauthenticated seeding if DB is empty (initial setup)

    const pw = await hashPassword('demo123');

    // Create users
    const admin = await db.user.create({ data: { email: 'admin@mclub.com', password: pw, name: 'MCLUB Admin', role: 'admin', phone: '+85262277662' } });
    const director1 = await db.user.create({ data: { email: 'chan@mypath.hk', password: pw, name: '陳志明', role: 'director', phone: '+85291234567' } });
    const director2 = await db.user.create({ data: { email: 'lee@mypath.hk', password: pw, name: '李美琪', role: 'director' } });
    const director3 = await db.user.create({ data: { email: 'wong@mypath.hk', password: pw, name: '黃偉業', role: 'director' } });
    const director4 = await db.user.create({ data: { email: 'bosco@mclub.com', password: pw, name: 'Bosco', role: 'director' } });
    const director5 = await db.user.create({ data: { email: 'damon@mclub.com', password: pw, name: 'Damon Lewis', role: 'director' } });

    // Create products
    const p1 = await db.product.create({ data: { name: 'VFK健康產品', nameEn: 'VFK Health Product', emoji: '💊', description: '模塊化成功藍圖，Plan A/B/C三級會員制', descriptionEn: 'Modular success blueprint with Plan A/B/C membership tiers', category: 'health', priceMin: 4800, priceMax: 29800, currency: 'HKD', commissionRate: 15, status: 'active' } });
    const p2 = await db.product.create({ data: { name: '日本物業投資', nameEn: 'Japan Property Investment', emoji: '🏘️', description: '大阪物業6%租金保證，高度人才簽證→1年永住', descriptionEn: 'Osaka property 6% rental guarantee, highly skilled visa to PR in 1 year', category: 'property', priceMin: 3000000, priceMax: 10000000, currency: 'HKD', commissionRate: 3, status: 'active' } });
    const p3 = await db.product.create({ data: { name: '聖多美公民計劃/日本高度人才套裝', nameEn: 'STP Citizenship Program / Japan HSP Package', emoji: '🇸🇹', description: '非CRS管轄區，4代覆蓋，$90K USD', descriptionEn: 'Non-CRS jurisdiction, 4-generation coverage, $90K USD', category: 'immigration', priceMin: 700000, priceMax: 700000, currency: 'HKD', commissionRate: 8, status: 'active' } });
    const p4 = await db.product.create({ data: { name: 'NPC基金', nameEn: 'NPC Fund', emoji: '📈', description: '源石資本有限合夥基金，8%-35%回報', descriptionEn: 'Genso Capital LP Fund, 8%-35% returns', category: 'fund', priceMin: 780000, priceMax: 5000000, currency: 'HKD', commissionRate: 2, status: 'active' } });
    const p5 = await db.product.create({ data: { name: '家族信託', nameEn: 'Family Trust', emoji: '🏦', description: '香港信託設立，CRS合規架構', descriptionEn: 'Hong Kong trust setup, CRS compliant structure', category: 'trust', priceMin: 4500000, priceMax: 10000000, currency: 'HKD', commissionRate: 4, status: 'active' } });
    const p6 = await db.product.create({ data: { name: '公司秘書服務', nameEn: 'Corporate Secretary Services', emoji: '📋', description: '會計稅務、成立公司、政府補貼', descriptionEn: 'Accounting, tax, company formation, government subsidies', category: 'corporate', priceMin: 6000, priceMax: 50000, currency: 'HKD', commissionRate: 15, status: 'active' } });
    const p7 = await db.product.create({ data: { name: 'MyPath AI', nameEn: 'MyPath AI', emoji: '📱', description: 'AI智能旅遊管家，日本行程規劃', descriptionEn: 'AI smart travel assistant, Japan itinerary planning', category: 'technology', priceMin: 0, priceMax: 0, currency: 'HKD', commissionRate: 5, status: 'active' } });
    const p8 = await db.product.create({ data: { name: '英國教育諮詢', nameEn: 'UK Education Consultancy', emoji: '🎓', description: '頂尖學校申請、監護人服務', descriptionEn: 'Top school applications, guardian services', category: 'education', priceMin: 50000, priceMax: 500000, currency: 'HKD', commissionRate: 10, status: 'active' } });

    // Create customers
    const c1 = await db.customer.create({ data: { name: '李太太', phone: '+8613812345678', email: 'li@example.com', company: '李氏集團', nationality: '中國', status: 'active', referrerId: director1.id } });
    const c2 = await db.customer.create({ data: { name: '王總', phone: '+8613987654321', email: 'wang@example.com', company: '王氏控股', nationality: '中國', status: 'active', referrerId: director1.id } });
    const c3 = await db.customer.create({ data: { name: '張小姐', phone: '+85298765432', email: 'cheung@example.com', nationality: '香港', status: 'prospect', referrerId: director2.id } });
    const c4 = await db.customer.create({ data: { name: '陳生', phone: '+85291234567', email: 'chan2@example.com', company: '陳氏地產', nationality: '香港', status: 'active', referrerId: director1.id } });
    const c5 = await db.customer.create({ data: { name: 'Tanaka-san', phone: '+81312345678', email: 'tanaka@example.com', company: 'Tanaka Corp', nationality: '日本', status: 'active' } });

    // Create orders
    await db.order.create({ data: { customerId: c1.id, productId: p1.id, agentId: director1.id, status: 'completed', amount: 4800, currency: 'HKD', commission: 720, notes: 'VFK Plan A' } });
    await db.order.create({ data: { customerId: c2.id, productId: p4.id, agentId: director1.id, status: 'pending', amount: 780000, currency: 'HKD', commission: 15600, notes: 'NPC基金認購' } });
    await db.order.create({ data: { customerId: c2.id, productId: p2.id, agentId: director1.id, status: 'processing', amount: 3000000, currency: 'HKD', commission: 90000, notes: '大阪物業投資' } });
    await db.order.create({ data: { customerId: c4.id, productId: p5.id, agentId: director2.id, status: 'pending', amount: 4500000, currency: 'HKD', commission: 180000, notes: '家族信託設立' } });
    await db.order.create({ data: { customerId: c3.id, productId: p6.id, agentId: director2.id, status: 'completed', amount: 12000, currency: 'HKD', commission: 1800, notes: '公司秘書年費' } });
    await db.order.create({ data: { customerId: c5.id, productId: p2.id, agentId: director1.id, status: 'processing', amount: 5000000, currency: 'HKD', commission: 150000, notes: '東京物業投資' } });
    await db.order.create({ data: { customerId: c1.id, productId: p8.id, agentId: director1.id, status: 'cancelled', amount: 80000, currency: 'HKD', commission: 0, notes: '英國教育諮詢' } });

    // Create commissions
    await db.commission.create({ data: { agentId: director1.id, amount: 720, currency: 'HKD', status: 'paid', paidAt: new Date() } });
    await db.commission.create({ data: { agentId: director2.id, amount: 1800, currency: 'HKD', status: 'paid', paidAt: new Date() } });
    await db.commission.create({ data: { agentId: director1.id, amount: 15600, currency: 'HKD', status: 'pending' } });
    await db.commission.create({ data: { agentId: director1.id, amount: 90000, currency: 'HKD', status: 'approved' } });
    await db.commission.create({ data: { agentId: director2.id, amount: 180000, currency: 'HKD', status: 'pending' } });

    // Create events
    const e1 = await db.event.create({ data: { title: 'MCLUB 2026 夏季投資論壇', description: '探討家族辦公室資產配置策略，邀請行業專家分享市場見解', type: 'seminar', date: new Date('2026-07-15T14:00:00'), location: '香港四季酒店宴會廳', maxAttendees: 50, status: 'upcoming' } });
    const e2 = await db.event.create({ data: { title: '日本物業投資說明會', description: '大阪物業投資機會深度解析，6%租金保證方案', type: 'webinar', date: new Date('2026-07-22T10:00:00'), location: '線上 Zoom 會議', maxAttendees: 30, status: 'upcoming' } });
    await db.event.create({ data: { title: 'VFK健康產品體驗日', description: '產品試用及健康諮詢，Plan A/B/C會員專享', type: 'training', date: new Date('2026-08-05T15:00:00'), location: 'MCLUB會所', maxAttendees: 20, status: 'upcoming' } });

    // Create event participants (RSVPs)
    await db.eventParticipant.createMany({ data: [
      { eventId: e1.id, userId: director1.id, status: 'registered' },
      { eventId: e1.id, userId: director2.id, status: 'attended' },
      { eventId: e2.id, userId: director1.id, status: 'registered' },
      { eventId: e2.id, userId: director3.id, status: 'registered' },
    ] });

    // Create notifications
    await db.notification.createMany({ data: [
      { userId: admin.id, title: '新訂單通知', message: '李太太已購買VFK健康產品，訂單金額HK$4,800', type: 'info', read: false },
      { userId: admin.id, title: '系統更新', message: 'CRM系統已升級至v3.0', type: 'info', read: false },
      { userId: admin.id, title: '佣金已分帳', message: 'VFK健康產品訂單佣金已分帳完成，共HK$2,520', type: 'success', read: true },
      { userId: director1.id, title: '客戶下單通知', message: '您推薦的李太太已購買VFK健康產品', type: 'info', read: false },
      { userId: director1.id, title: '佣金已發放', message: 'VFK健康產品佣金HK$720已發放到您的帳戶', type: 'success', read: true },
      { userId: director1.id, title: '活動邀請', message: '您被邀請參加MCLUB 2026夏季投資論壇', type: 'info', read: false },
      { userId: director3.id, title: '產品新訂單', message: '您的日本物業投資產品收到新訂單', type: 'info', read: false },
    ] });

    // Create notices
    await db.notice.createMany({ data: [
      { title: '系統升級通知', content: 'MCLUB CRM已升級至v3.0版本，新增JWT認證、分頁功能及客戶詳情頁面。', category: 'announcement', targetRoles: 'admin,director', authorId: admin.id, isPinned: true, isActive: true },
      { title: '夏季投資論壇報名開放', content: 'MCLUB 2026夏季投資論壇現已接受報名，名額有限，先到先得。', category: 'announcement', targetRoles: 'admin,director', authorId: admin.id, isPinned: false, isActive: true },
      { title: '合規政策更新', content: '請所有總監務必閱讀最新的KYC/AML合規政策，於2026年7月1日前完成培訓。', category: 'policy', targetRoles: 'director', authorId: admin.id, isPinned: true, isActive: true },
    ] });

    return NextResponse.json({ message: '數據初始化成功', users: 7, products: 8, customers: 5, orders: 7, commissions: 5, events: 3, notifications: 7, notices: 3 });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: '數據初始化失敗' }, { status: 500 });
  }
}
