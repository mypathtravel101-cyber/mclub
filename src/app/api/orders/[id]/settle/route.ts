import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, role } = auth;

    if (role !== 'admin') return NextResponse.json({ error: '只有管理員可進行分帳' }, { status: 403 });

    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: { product: true, agent: true },
    });
    if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });

    // Calculate director commission
    let directorAmount = 0;
    if (order.product.commissionFixed > 0) {
      directorAmount = order.product.commissionFixed;
    } else if (order.product.commissionRate > 0) {
      directorAmount = order.amount * order.product.commissionRate / 100;
    }

    // Create commission for director/agent
    if (order.agentId && directorAmount > 0) {
      await db.commission.create({
        data: {
          orderId: id,
          agentId: order.agentId,
          amount: directorAmount,
          currency: order.currency,
          status: 'pending',
        },
      });
    }

    return NextResponse.json({
      message: '分帳成功',
      directorAmount,
      directorName: order.agent?.name || '未知',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
