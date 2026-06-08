import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    if (userRole !== 'MCLUB_STAFF') return NextResponse.json({ error: '只有MCLUB Admin可進行分帳' }, { status: 403 });

    const { id } = await params;
    const order = await db.order.findUnique({ where: { id }, include: { product: true } });
    if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
    if (order.status !== 'COMPLETED') return NextResponse.json({ error: '只有已完成訂單可分帳' }, { status: 400 });
    if (order.commissionSettled) return NextResponse.json({ error: '此訂單已分帳' }, { status: 400 });

    const rules = JSON.parse(order.product.commissionRules);
    const agentAmount = order.amount * rules.agentRate / 100;
    const smeAmount = order.amount * rules.smeRate / 100;

    // Create commissions
    if (order.agentId && rules.agentRate > 0) {
      await db.commission.create({ data: { orderId: id, recipientId: order.agentId, role: 'AGENT', amount: agentAmount } });
    }
    if (rules.smeRate > 0) {
      await db.commission.create({ data: { orderId: id, recipientId: order.product.smeOwnerId, role: 'SME_OWNER', amount: smeAmount } });
    }

    // Update order
    await db.order.update({ where: { id }, data: { status: 'SETTLED', commissionSettled: true } });

    // Timeline event
    await db.timelineEvent.create({ data: { clientId: order.clientId, orderId: id, eventType: 'status_change', title: '訂單已分帳', description: `Agent佣金: HK$${agentAmount.toLocaleString()} | SME收入: HK$${smeAmount.toLocaleString()}`, createdById: userId } });

    return NextResponse.json({ message: '分帳成功', agentAmount, smeAmount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
