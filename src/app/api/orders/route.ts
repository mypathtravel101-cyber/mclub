import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    let orders;
    if (userRole === 'MCLUB_STAFF') {
      orders = await db.order.findMany({ include: { product: true, endUser: { select: { name: true } }, client: { select: { name: true, memberLevel: true } } }, orderBy: { createdAt: 'desc' } });
    } else if (userRole === 'SME_OWNER') {
      const products = await db.product.findMany({ where: { smeOwnerId: userId }, select: { id: true } });
      const productIds = products.map(p => p.id);
      orders = await db.order.findMany({ where: { productId: { in: productIds } }, include: { product: true, endUser: { select: { name: true } }, client: { select: { name: true, memberLevel: true } } }, orderBy: { createdAt: 'desc' } });
    } else if (userRole === 'AGENT') {
      orders = await db.order.findMany({ where: { agentId: userId }, include: { product: true, endUser: { select: { name: true } }, client: { select: { name: true, memberLevel: true } } }, orderBy: { createdAt: 'desc' } });
    } else {
      // END_USER
      orders = await db.order.findMany({ where: { endUserId: userId }, include: { product: true }, orderBy: { createdAt: 'desc' } });
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
    const order = await db.order.create({ data: { productId: data.productId, endUserId: data.endUserId, clientId: data.clientId, agentId: data.agentId || userId, amount: data.amount, currency: data.currency || 'HKD', notes: data.notes } });
    await db.timelineEvent.create({ data: { clientId: data.clientId, orderId: order.id, eventType: 'purchase', title: '新增訂單', description: `訂單金額 ${data.currency === 'USD' ? 'US$' : 'HK$'}${data.amount.toLocaleString()}`, createdById: userId } });
    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
