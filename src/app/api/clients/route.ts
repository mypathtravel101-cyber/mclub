import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    let clients;
    if (userRole === 'MCLUB_STAFF') {
      clients = await db.client.findMany({
        include: {
          agent: { select: { id: true, name: true } },
          orders: { include: { product: { select: { name: true, icon: true } } } },
          timelineEvents: { orderBy: { createdAt: 'desc' }, take: 3 }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (userRole === 'AGENT') {
      clients = await db.client.findMany({
        where: { agentId: userId },
        include: {
          orders: { include: { product: { select: { name: true, icon: true } } } },
          timelineEvents: { orderBy: { createdAt: 'desc' }, take: 3 }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (userRole === 'SME_OWNER') {
      const products = await db.product.findMany({
        where: { smeOwnerId: userId },
        select: { id: true }
      });
      const productIds = products.map(p => p.id);
      clients = await db.client.findMany({
        where: { orders: { some: { productId: { in: productIds } } } },
        include: {
          agent: { select: { id: true, name: true } },
          orders: {
            where: { productId: { in: productIds } },
            include: { product: { select: { name: true, icon: true } } }
          },
          timelineEvents: { orderBy: { createdAt: 'desc' }, take: 3 }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      clients = [];
    }
    return NextResponse.json({ clients });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    if (userRole !== 'MCLUB_STAFF' && userRole !== 'AGENT') {
      return NextResponse.json({ error: '無權限' }, { status: 403 });
    }
    const data = await req.json();
    const client = await db.client.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        source: data.source || 'Agent推薦',
        memberLevel: data.memberLevel || 'PLAN_A',
        agentId: data.agentId || userId,
        notes: data.notes
      }
    });
    await db.timelineEvent.create({
      data: {
        clientId: client.id,
        eventType: 'note',
        title: '新增客戶',
        description: `${client.name} 加入MCLUB`,
        createdById: userId
      }
    });
    return NextResponse.json({ client });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
