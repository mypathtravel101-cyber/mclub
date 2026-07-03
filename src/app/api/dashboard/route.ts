import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

// Helper: build weekly & monthly performance arrays from orders
function buildPerformanceData(orders: { createdAt: Date; amount: number }[]) {
  const now = new Date();

  // ── Weekly: last 8 weeks ──
  const weeklyData: { label: string; orders: number; revenue: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - i * 7); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekOrders = orders.filter(o => o.createdAt >= weekStart && o.createdAt < weekEnd);
    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    weeklyData.push({
      label,
      orders: weekOrders.length,
      revenue: weekOrders.reduce((s, o) => s + o.amount, 0),
    });
  }

  // ── Monthly: last 6 months ──
  const monthlyData: { label: string; orders: number; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const monthOrders = orders.filter(o => o.createdAt >= monthStart && o.createdAt < monthEnd);
    const label = `${monthStart.getFullYear()}/${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
    monthlyData.push({
      label,
      orders: monthOrders.length,
      revenue: monthOrders.reduce((s, o) => s + o.amount, 0),
    });
  }

  return { weeklyData, monthlyData };
}

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { userId, role } = auth;

    // ── Director: only show their own performance data ──
    if (role === 'director') {
      const myOrders = await db.order.findMany({
        where: { agentId: userId },
        include: {
          customer: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, emoji: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Deduplicate customers
      const myCustomerMap = new Map<string, { id: string; name: string }>();
      for (const o of myOrders) {
        if (!myCustomerMap.has(o.customer.id)) {
          myCustomerMap.set(o.customer.id, { id: o.customer.id, name: o.customer.name });
        }
      }

      // Product revenue distribution (only my orders)
      const productRevenueMap = new Map<string, { id: string; name: string; emoji: string; revenue: number; orderCount: number }>();
      for (const o of myOrders) {
        const existing = productRevenueMap.get(o.product.id);
        if (existing) {
          existing.revenue += o.amount;
          existing.orderCount++;
        } else {
          productRevenueMap.set(o.product.id, {
            id: o.product.id,
            name: o.product.name,
            emoji: o.product.emoji,
            revenue: o.amount,
            orderCount: 1,
          });
        }
      }
      const revenueByProduct = Array.from(productRevenueMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

      // Commission data
      const myCommissions = await db.commission.findMany({
        where: { agentId: userId },
      });
      const totalCommission = myCommissions.reduce((sum, c) => sum + c.amount, 0);
      const paidCommission = myCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
      const pendingCommission = myCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
      const approvedCommission = myCommissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0);

      // Order status breakdown
      const orderStatusMap = new Map<string, number>();
      for (const o of myOrders) {
        orderStatusMap.set(o.status, (orderStatusMap.get(o.status) || 0) + 1);
      }
      const orderStats = Array.from(orderStatusMap.entries()).map(([status, _count]) => ({ status, _count }));

      // Total revenue from my orders
      const totalRevenue = myOrders.reduce((sum, o) => sum + o.amount, 0);

      // Recent orders (latest 5)
      const recentOrders = myOrders.slice(0, 5).map(o => ({
        id: o.id,
        amount: o.amount,
        currency: o.currency,
        status: o.status,
        createdAt: o.createdAt,
        customer: { name: o.customer.name },
        product: { name: o.product.name, emoji: o.product.emoji },
        agent: { name: auth.name || '' },
      }));

      // Weekly & Monthly performance
      const { weeklyData, monthlyData } = buildPerformanceData(
        myOrders.map(o => ({ createdAt: new Date(o.createdAt), amount: o.amount }))
      );

      return NextResponse.json({
        isDirector: true,
        totalOrders: myOrders.length,
        totalCustomers: myCustomerMap.size,
        totalRevenue,
        totalCommission,
        paidCommission,
        pendingCommission,
        approvedCommission,
        orderStats,
        recentOrders,
        revenueByProduct,
        weeklyData,
        monthlyData,
      });
    }

    // ── Admin: show everything ──
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      totalEvents,
      orderStats,
      commissionStats,
      recentOrders,
      productRevenue,
    ] = await Promise.all([
      db.order.count(),
      db.customer.count(),
      db.product.count({ where: { status: 'active' } }),
      db.event.count({ where: { status: 'upcoming' } }),
      db.order.groupBy({ by: ['status'], _count: true }),
      db.commission.groupBy({ by: ['status'], _sum: { amount: true } }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          product: { select: { name: true, emoji: true } },
          agent: { select: { name: true } },
        },
      }),
      db.order.groupBy({
        by: ['productId'],
        _sum: { amount: true },
        where: { status: { in: ['completed', 'processing'] } },
      }),
    ]);

    const products = await db.product.findMany({
      select: { id: true, name: true, emoji: true },
    });

    const revenueByProduct = productRevenue.map((r) => {
      const product = products.find((p) => p.id === r.productId);
      return {
        id: r.productId,
        name: product?.name || 'Unknown',
        emoji: product?.emoji || '',
        revenue: r._sum.amount || 0,
      };
    });

    const totalRevenue = productRevenue.reduce((sum, r) => sum + (r._sum.amount || 0), 0);
    const totalCommission = commissionStats
      .filter((s) => s.status === 'paid')
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);
    const pendingCommission = commissionStats
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);

    // Weekly & Monthly performance for admin
    const allOrders = await db.order.findMany({
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'desc' },
    });
    const { weeklyData, monthlyData } = buildPerformanceData(
      allOrders.map(o => ({ createdAt: new Date(o.createdAt), amount: o.amount }))
    );

    return NextResponse.json({
      isDirector: false,
      totalOrders,
      totalCustomers,
      totalProducts,
      totalEvents,
      totalRevenue,
      totalCommission,
      pendingCommission,
      orderStats,
      recentOrders,
      revenueByProduct,
      weeklyData,
      monthlyData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
