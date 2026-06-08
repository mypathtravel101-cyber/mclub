import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const { role } = await params;
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '未提供用戶ID' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: '找不到用戶' }, { status: 404 });
    }

    if (role === 'MCLUB_STAFF') {
      // MCLUB Staff dashboard data
      const totalClients = await db.client.count();
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
        icon: p.icon,
        color: p.color,
        orderCount: p._count.orders,
      }));

      // Agent performance ranking
      const agents = await db.user.findMany({
        where: { role: 'AGENT' },
        include: {
          _count: { select: { clients: true } },
          commissions: {
            where: { role: 'AGENT' },
            select: { amount: true },
          },
        },
      });
      const agentRanking = agents.map(a => ({
        id: a.id,
        name: a.name,
        clientCount: a._count.clients,
        totalCommission: a.commissions.reduce((sum, c) => sum + c.amount, 0),
      })).sort((a, b) => b.totalCommission - a.totalCommission);

      // Pending orders
      const pendingOrders = await db.order.findMany({
        where: { status: 'PENDING' },
        include: {
          product: { select: { name: true, icon: true } },
          client: { select: { name: true } },
          agent: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Commission status summary
      const pendingCommissions = await db.commission.aggregate({
        _sum: { amount: true },
        where: { status: 'PENDING' },
      });
      const paidCommissions = await db.commission.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      });

      // Recent orders
      const recentOrders = await db.order.findMany({
        include: {
          product: { select: { name: true, icon: true, color: true } },
          client: { select: { name: true } },
          agent: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      return NextResponse.json({
        totalClients,
        totalOrders,
        totalCommissionAmount: totalCommissions._sum.amount || 0,
        thisMonthCommissionAmount: thisMonthCommissions._sum.amount || 0,
        productSales,
        agentRanking,
        pendingOrders,
        pendingCommissionAmount: pendingCommissions._sum.amount || 0,
        paidCommissionAmount: paidCommissions._sum.amount || 0,
        recentOrders,
      });

    } else if (role === 'SME_OWNER') {
      // SME Owner dashboard data
      const myProducts = await db.product.findMany({
        where: { smeOwnerId: userId },
        include: { _count: { select: { orders: true } } },
      });

      const productIds = myProducts.map(p => p.id);

      const myOrders = await db.order.findMany({
        where: { productId: { in: productIds } },
        include: {
          product: { select: { name: true, icon: true, color: true } },
          client: { select: { name: true } },
          agent: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const pendingDelivery = myOrders.filter(o => o.status === 'IN_PROGRESS').length;
      const completedOrders = myOrders.filter(o => o.status === 'COMPLETED' || o.status === 'SETTLED').length;
      const totalRevenue = myOrders.reduce((sum, o) => sum + o.amount, 0);

      // Agent performance for my products
      const agentOrders = await db.order.findMany({
        where: { productId: { in: productIds }, agentId: { not: null } },
        include: { agent: { select: { id: true, name: true } } },
      });
      const agentMap = new Map<string, { name: string; count: number; revenue: number }>();
      for (const o of agentOrders) {
        if (o.agent) {
          const existing = agentMap.get(o.agent.id) || { name: o.agent.name, count: 0, revenue: 0 };
          existing.count++;
          existing.revenue += o.amount;
          agentMap.set(o.agent.id, existing);
        }
      }

      return NextResponse.json({
        myProducts: myProducts.map(p => ({ ...p, orderCount: p._count.orders })),
        myOrders,
        pendingDelivery,
        completedOrders,
        totalRevenue,
        agentPerformance: Array.from(agentMap.entries()).map(([id, data]) => ({ id, ...data })),
      });

    } else if (role === 'AGENT') {
      // Agent dashboard data
      const myClients = await db.client.findMany({
        where: { agentId: userId },
        include: {
          orders: {
            include: {
              product: { select: { name: true, icon: true, color: true } },
            },
          },
        },
      });

      const myCommissions = await db.commission.findMany({
        where: { recipientId: userId, role: 'AGENT' },
        include: {
          order: {
            include: {
              product: { select: { name: true, icon: true } },
              client: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalCommission = myCommissions.reduce((sum, c) => sum + c.amount, 0);
      const pendingCommission = myCommissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.amount, 0);
      const paidCommission = myCommissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0);

      // Client follow-up status
      const clientStatuses = myClients.map(c => ({
        id: c.id,
        name: c.name,
        memberLevel: c.memberLevel,
        totalSpent: c.totalSpent,
        orderCount: c.orders.length,
        lastOrderDate: c.orders[0]?.createdAt || null,
      }));

      return NextResponse.json({
        clientCount: myClients.length,
        totalCommission,
        pendingCommission,
        paidCommission,
        clientStatuses,
        myCommissions,
        myClients,
      });

    } else if (role === 'END_USER') {
      // End User dashboard data
      const myOrders = await db.order.findMany({
        where: { endUserId: userId },
        include: {
          product: { select: { id: true, name: true, icon: true, color: true, description: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const user2 = await db.user.findUnique({
        where: { id: userId },
        include: { referredBy: { select: { id: true, name: true } } },
      });

      return NextResponse.json({
        myOrders,
        memberLevel: 'PLAN_A', // Default
        referredBy: user2?.referredBy,
        totalSpent: myOrders.reduce((sum, o) => sum + o.amount, 0),
      });
    }

    return NextResponse.json({ error: '無效的角色' }, { status: 400 });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: '獲取儀表盤數據失敗' }, { status: 500 });
  }
}
