import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    // Run ALL queries sequentially to prevent SQLite concurrent access issues
    const totalClients = await db.client.count();
    const totalOrders = await db.order.count();
    const totalRevenueResult = await db.order.aggregate({ _sum: { amount: true } });
    const pendingOrders = await db.order.count({ where: { status: 'PENDING' } });
    const completedOrders = await db.order.count({ where: { status: 'COMPLETED' } });
    const settledOrders = await db.order.count({ where: { status: 'SETTLED' } });

    const products = await db.product.findMany({ 
      include: { _count: { select: { orders: true } }, smeOwner: { select: { name: true } } } 
    });

    const agents = await db.user.findMany({ 
      where: { role: 'AGENT' }, 
      select: { id: true, name: true, _count: { select: { clients: true } } } 
    });

    const myCommissionsResult = await db.commission.aggregate({ 
      where: { recipientId: userId }, _sum: { amount: true } 
    });

    const myPendingCommissionsResult = await db.commission.aggregate({ 
      where: { recipientId: userId, status: 'PENDING' }, _sum: { amount: true } 
    });

    let smeProductOrders = null;
    if (userRole === 'SME_OWNER') {
      const myProducts = await db.product.findMany({ 
        where: { smeOwnerId: userId }, select: { id: true } 
      });
      const myProductIds = myProducts.map(p => p.id);
      if (myProductIds.length > 0) {
        smeProductOrders = await db.order.findMany({ 
          where: { productId: { in: myProductIds } }, 
          include: { product: { select: { name: true, icon: true } }, client: { select: { name: true } } }, 
          take: 10, orderBy: { createdAt: 'desc' } 
        });
      }
    }

    let myClients = null;
    if (userRole === 'AGENT') {
      myClients = await db.client.findMany({ 
        where: { agentId: userId }, 
        include: { orders: { include: { product: { select: { name: true, icon: true } } } } }, 
        take: 10, orderBy: { createdAt: 'desc' } 
      });
    }

    let myOrders = null;
    if (userRole === 'END_USER') {
      myOrders = await db.order.findMany({ 
        where: { endUserId: userId }, 
        include: { product: true }, 
        orderBy: { createdAt: 'desc' } 
      });
    }

    return NextResponse.json({
      totalClients, totalOrders, 
      totalRevenue: totalRevenueResult._sum.amount || 0,
      pendingOrders, completedOrders, settledOrders,
      products, agents,
      myCommissions: myCommissionsResult._sum.amount || 0,
      myPendingCommissions: myPendingCommissionsResult._sum.amount || 0,
      smeProductOrders, myClients, myOrders,
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: error.message || '獲取儀表盤數據失敗' }, { status: 500 });
  }
}
