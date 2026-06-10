import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
