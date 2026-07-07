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
        product: { select: { id: true, name: true, emoji: true } },
        customer: { select: { id: true, name: true, phone: true, email: true } },
        agent: { select: { id: true, name: true } },
        commissions: { select: { id: true, amount: true, status: true } },
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
    const { userId, role } = auth;

    if (role !== 'admin') return NextResponse.json({ error: '只有iBanker Admin可更新訂單' }, { status: 403 });
    const { id } = await params;
    const data = await req.json();
    const order = await db.order.update({ where: { id }, data: { status: data.status } });
    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { role } = auth;

    if (role !== 'admin' && role !== 'director') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const { id } = await params;
    const order = await db.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });

    await db.commission.deleteMany({ where: { orderId: id } });
    await db.order.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
