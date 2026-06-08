import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    // Set cache headers
    const headers = { 'Cache-Control': 'no-store, max-age=0' };

    if (userRole === 'MCLUB_STAFF') {
      // ── Monthly Revenue (last 6 months) ──
      const now = new Date();
      const monthlyRevenue: { month: string; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const result = await db.order.aggregate({
          _sum: { amount: true },
          where: { createdAt: { gte: monthStart, lt: monthEnd } },
        });
        const label = `${d.getMonth() + 1}月`;
        monthlyRevenue.push({ month: label, revenue: result._sum.amount || 0 });
      }

      // ── Order Status Distribution ──
      const orderStatusCounts = await db.order.groupBy({ by: ['status'], _count: true });
      const statusColors: Record<string, string> = { PENDING: '#E2B93B', IN_PROGRESS: '#4A90D9', COMPLETED: '#27AE60', SETTLED: '#D4AF37' };
      const statusLabels: Record<string, string> = { PENDING: '待確認', IN_PROGRESS: '進行中', COMPLETED: '已完成', SETTLED: '已分帳' };
      const orderStatusDist = orderStatusCounts.map(s => ({
        name: statusLabels[s.status] || s.status,
        value: s._count,
        color: statusColors[s.status] || '#8899aa',
      }));

      // ── Client Level Distribution ──
      const clientLevelCounts = await db.client.groupBy({ by: ['memberLevel'], _count: true });
      const levelLabels: Record<string, string> = { PLAN_A: 'Plan A', PLAN_B: 'Plan B', PLAN_C: 'Plan C', FULL: 'MCLUB全會員' };
      const levelColors: Record<string, string> = { PLAN_A: '#4A90D9', PLAN_B: '#27AE60', PLAN_C: '#D4AF37', FULL: '#8E44AD' };
      const clientLevelDist = clientLevelCounts.map(l => ({
        name: levelLabels[l.memberLevel] || l.memberLevel,
        value: l._count,
        color: levelColors[l.memberLevel] || '#8899aa',
      }));

      // ── Commission Breakdown by Recipient Role ──
      const commissionByRole = await db.commission.groupBy({ by: ['role'], _sum: { amount: true } });
      const roleLabels: Record<string, string> = { MCLUB_STAFF: 'MCLUB', SME_OWNER: 'SME老闆', AGENT: 'Agent', END_USER: '客戶' };
      const roleColors: Record<string, string> = { MCLUB_STAFF: '#D4AF37', SME_OWNER: '#1ABC9C', AGENT: '#4A90D9', END_USER: '#8E44AD' };
      const commissionBreakdown = commissionByRole.map(r => ({
        name: roleLabels[r.role] || r.role,
        amount: r._sum.amount || 0,
        color: roleColors[r.role] || '#8899aa',
      }));

      // ── Top Products by Revenue ──
      const productRevenue = await db.order.groupBy({ by: ['productId'], _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } }, take: 5 });
      const productNames = await db.product.findMany({ select: { id: true, name: true, icon: true } });
      const productNameMap = new Map(productNames.map(p => [p.id, p.name]));
      const topProducts = productRevenue.map(p => ({
        name: productNameMap.get(p.productId) || '未知',
        revenue: p._sum.amount || 0,
      }));

      return NextResponse.json({
        monthlyRevenue, orderStatusDist, clientLevelDist, commissionBreakdown, topProducts,
      }, { headers });
    }

    if (userRole === 'SME_OWNER') {
      // ── SME Owner: Product Revenue & Monthly Trend ──
      const myProducts = await db.product.findMany({ where: { smeOwnerId: userId }, select: { id: true, name: true, icon: true } });
      const myProductIds = myProducts.map(p => p.id);

      const productRevenueRaw = await db.order.groupBy({ by: ['productId'], _sum: { amount: true }, where: { productId: { in: myProductIds } } });
      const productRevenue = productRevenueRaw.map(pr => ({
        name: myProducts.find(p => p.id === pr.productId)?.name || '未知',
        revenue: pr._sum.amount || 0,
      }));

      const now = new Date();
      const monthlyRevenue: { month: string; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const result = await db.order.aggregate({
          _sum: { amount: true },
          where: { productId: { in: myProductIds }, createdAt: { gte: monthStart, lt: monthEnd } },
        });
        monthlyRevenue.push({ month: `${d.getMonth() + 1}月`, revenue: result._sum.amount || 0 });
      }

      const myCommissions = await db.commission.aggregate({ where: { recipientId: userId }, _sum: { amount: true } });

      return NextResponse.json({
        productRevenue, monthlyRevenue,
        totalRevenue: myCommissions._sum.amount || 0,
      }, { headers });
    }

    if (userRole === 'AGENT') {
      // ── Agent: Commission Trend & Client Conversion ──
      const now = new Date();
      const monthlyCommission: { month: string; commission: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const result = await db.commission.aggregate({
          _sum: { amount: true },
          where: { recipientId: userId, createdAt: { gte: monthStart, lt: monthEnd } },
        });
        monthlyCommission.push({ month: `${d.getMonth() + 1}月`, commission: result._sum.amount || 0 });
      }

      const myClients = await db.client.findMany({ where: { agentId: userId }, select: { id: true, memberLevel: true, totalSpent: true } });
      const levelLabels: Record<string, string> = { PLAN_A: 'Plan A', PLAN_B: 'Plan B', PLAN_C: 'Plan C', FULL: 'MCLUB全會員' };
      const levelColors: Record<string, string> = { PLAN_A: '#4A90D9', PLAN_B: '#27AE60', PLAN_C: '#D4AF37', FULL: '#8E44AD' };
      const clientConversion = Object.entries(
        myClients.reduce((acc: Record<string, number>, c) => { acc[c.memberLevel] = (acc[c.memberLevel] || 0) + 1; return acc; }, {})
      ).map(([level, count]) => ({ name: levelLabels[level] || level, value: count, color: levelColors[level] || '#8899aa' }));

      const totalClients = myClients.length;
      const clientsWithOrders = myClients.filter(c => c.totalSpent > 0).length;
      const conversionRate = totalClients > 0 ? Math.round((clientsWithOrders / totalClients) * 100) : 0;

      return NextResponse.json({
        monthlyCommission, clientConversion, totalClients, conversionRate,
      }, { headers });
    }

    // ── END_USER: Spending Breakdown by Category ──
    const myOrders = await db.order.findMany({
      where: { endUserId: userId },
      include: { product: { select: { name: true, category: true, icon: true } } },
    });

    const categoryColors: Record<string, string> = { '健康': '#E74C3C', '物業': '#F39C12', '身份': '#1ABC9C', '基金': '#27AE60', '信託': '#8E44AD', '企業': '#7F8C8D', '科技': '#2980B9' };
    const categorySpending = Object.entries(
      myOrders.reduce((acc: Record<string, number>, o) => {
        const cat = o.product?.category || '其他';
        acc[cat] = (acc[cat] || 0) + o.amount;
        return acc;
      }, {})
    ).map(([category, amount]) => ({
      name: category,
      value: amount,
      color: categoryColors[category] || '#8899aa',
    }));

    const totalSpent = myOrders.reduce((s, o) => s + o.amount, 0);

    return NextResponse.json({
      categorySpending, totalSpent, orderCount: myOrders.length,
    }, { headers });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: error.message || '獲取分析數據失敗' }, { status: 500 });
  }
}
