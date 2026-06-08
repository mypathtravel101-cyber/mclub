import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });

    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        product: { include: { smeOwner: { select: { id: true, name: true } } } },
        endUser: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, memberLevel: true, phone: true, email: true } },
        agent: { select: { id: true, name: true } },
        commissions: { include: { recipient: { select: { name: true, role: true } } } },
        timelineEvents: { include: { createdBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    if (userRole !== 'MCLUB_STAFF') return NextResponse.json({ error: '只有MCLUB Admin可更新訂單' }, { status: 403 });
    const { id } = await params;
    const data = await req.json();
    const order = await db.order.update({ where: { id }, data: { status: data.status } });
    if (data.status) {
      const statusMap: Record<string, string> = { PENDING: '待確認', IN_PROGRESS: '進行中', COMPLETED: '已完成', SETTLED: '已分帳' };
      await db.timelineEvent.create({ data: { clientId: order.clientId, orderId: id, eventType: 'status_change', title: '訂單狀態更新', description: `訂單狀態變更為：${statusMap[data.status] || data.status}`, createdById: userId } });
    }
    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
