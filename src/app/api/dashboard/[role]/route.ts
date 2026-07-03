import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { role } = await params;
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '未提供用戶ID' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: '找不到用戶' }, { status: 404 });
    }

    if (role === 'admin') {
      // Admin dashboard data - uses Customer model (not Client)
      const totalCustomers = await db.customer.count();
      const totalOrders = await db.order.count();
      const totalCommissions = await db.commission.aggregate({ _sum: { amount: true } });
      const thisMonthCommissions = await db.commission.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      });

      // Product sales progress
      const products = await db.product.findMany({
        include: { _count: { select: { orders: true } } },
      });
      const productSales = products.map(p => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        orderCount: p._count.orders,
      }));

      // Director performance ranking
      const directors = await db.user.findMany({
        where: { role: 'director' },
        include: {
          orders: {
            select: { commission: true },
          },
        },
      });
      const directorRanking = directors.map(a => ({
        id: a.id,
        name: a.name,
        orderCount: a.orders.length,
        totalCommission: a.orders.reduce((sum, o) => sum + (o.commission || 0), 0),
      })).sort((a, b) => b.totalCommission - a.totalCommission);

      // Pending orders
      const pendingOrders = await db.order.findMany({
        where: { status: 'pending' },
        include: {
          product: { select: { name: true, emoji: true } },
          customer: { select: { name: true } },
          agent: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Commission status summary
      const pendingCommissions = await db.commission.aggregate({
        _sum: { amount: true },
        where: { status: 'pending' },
      });
      const approvedCommissions = await db.commission.aggregate({
        _sum: { amount: true },
        where: { status: 'approved' },
      });
      const paidCommissions = await db.commission.aggregate({
        _sum: { amount: true },
        where: { status: 'paid' },
      });

      // Recent orders
      const recentOrders = await db.order.findMany({
        include: {
          product: { select: { name: true, emoji: true } },
          customer: { select: { name: true } },
          agent: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      return NextResponse.json({
        totalCustomers,
        totalOrders,
        totalCommissionAmount: totalCommissions._sum.amount || 0,
        thisMonthCommissionAmount: thisMonthCommissions._sum.amount || 0,
        productSales,
        directorRanking,
        pendingOrders,
        pendingCommissionAmount: pendingCommissions._sum.amount || 0,
        approvedCommissionAmount: approvedCommissions._sum.amount || 0,
        paidCommissionAmount: paidCommissions._sum.amount || 0,
        recentOrders,
      });

    } else if (role === 'director') {
      // Director dashboard data - customers served by this director (via orders)
      const myOrders = await db.order.findMany({
        where: { agentId: userId },
        include: {
          customer: { select: { id: true, name: true, status: true } },
          product: { select: { name: true, emoji: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Deduplicate customers
      const myCustomerMap = new Map<string, { id: string; name: string; status: string; orderCount: number }>();
      for (const o of myOrders) {
        const existing = myCustomerMap.get(o.customer.id);
        if (existing) {
          existing.orderCount++;
        } else {
          myCustomerMap.set(o.customer.id, { id: o.customer.id, name: o.customer.name, status: o.customer.status, orderCount: 1 });
        }
      }
      const myCustomers = Array.from(myCustomerMap.values());

      const myCommissions = await db.commission.findMany({
        where: { agentId: userId },
        include: {
          order: {
            include: {
              product: { select: { name: true, emoji: true } },
              customer: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalCommission = myCommissions.reduce((sum, c) => sum + c.amount, 0);
      const pendingCommission = myCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
      const paidCommission = myCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);

      return NextResponse.json({
        customerCount: myCustomers.length,
        totalCommission,
        pendingCommission,
        paidCommission,
        myCustomers,
        myCommissions,
      });

    }

    return NextResponse.json({ error: '無效的角色' }, { status: 400 });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: '獲取儀表盤數據失敗' }, { status: 500 });
  }
}
