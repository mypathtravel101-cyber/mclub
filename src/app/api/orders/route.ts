import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    let orders;
    const includeOpts = {
      product: { include: { smeOwner: { select: { id: true, name: true } } } },
      endUser: { select: { name: true } },
      client: { select: { name: true, memberLevel: true } },
      agent: { select: { id: true, name: true } },
      commissions: { include: { recipient: { select: { name: true, role: true } } } },
      timelineEvents: { orderBy: { createdAt: 'desc' as const } },
    };

    if (userRole === 'MCLUB_STAFF') {
      orders = await db.order.findMany({ include: includeOpts, orderBy: { createdAt: 'desc' } });
    } else if (userRole === 'SME_OWNER') {
      const products = await db.product.findMany({ where: { smeOwnerId: userId }, select: { id: true } });
      const productIds = products.map(p => p.id);
      orders = await db.order.findMany({ where: { productId: { in: productIds } }, include: includeOpts, orderBy: { createdAt: 'desc' } });
    } else if (userRole === 'AGENT') {
      orders = await db.order.findMany({ where: { agentId: userId }, include: includeOpts, orderBy: { createdAt: 'desc' } });
    } else {
      // END_USER
      orders = await db.order.findMany({ where: { endUserId: userId }, include: { product: true, timelineEvents: { orderBy: { createdAt: 'desc' as const } } }, orderBy: { createdAt: 'desc' } });
    }
    return NextResponse.json({ orders });
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

    // If no endUserId provided, try to find or use the client's info
    let endUserId = data.endUserId;
    if (!endUserId) {
      // Find an existing END_USER or create one from client info
      const client = await db.client.findUnique({ where: { id: data.clientId } });
      if (client?.email) {
        const existingUser = await db.user.findUnique({ where: { email: client.email } });
        if (existingUser) {
          endUserId = existingUser.id;
        }
      }
      if (!endUserId) {
        // Create a minimal END_USER record
        const client2 = await db.client.findUnique({ where: { id: data.clientId } });
        const newEndUser = await db.user.create({
          data: {
            email: `client_${data.clientId}@mclub.tmp`,
            password: 'tmp_placeholder',
            name: client2?.name || 'Unknown Client',
            role: 'END_USER',
            referredById: data.agentId || userId,
          },
        });
        endUserId = newEndUser.id;
      }
    }

    const agentId = data.agentId || userId;
    const order = await db.order.create({
      data: {
        productId: data.productId,
        endUserId,
        clientId: data.clientId,
        agentId,
        amount: parseFloat(String(data.amount)) || 0,
        currency: data.currency || 'HKD',
        notes: data.notes || null,
        commissionSettled: false,
      },
      include: {
        product: { include: { smeOwner: { select: { id: true, name: true } } } },
        client: { select: { name: true, memberLevel: true } },
        agent: { select: { id: true, name: true } },
      },
    });

    const currSymbol = order.currency === 'USD' ? 'US$' : order.currency === 'RMB' ? '¥' : order.currency === 'JPY' ? '¥' : 'HK$';
    await db.timelineEvent.create({
      data: {
        clientId: data.clientId,
        orderId: order.id,
        eventType: 'purchase',
        title: '新增訂單',
        description: `${order.product?.name || '產品'} - ${currSymbol}${order.amount.toLocaleString()}`,
        createdById: userId,
      },
    });

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
