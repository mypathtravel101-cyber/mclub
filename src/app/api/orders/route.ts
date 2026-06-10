import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, emoji: true } },
        agent: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, amount, ...rest } = body;
    const product = await db.product.findUnique({ where: { id: productId } });
    const commission = amount * ((product?.commissionRate || 0) / 100);
    const order = await db.order.create({
      data: { ...rest, productId, amount, commission },
    });
    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const order = await db.order.update({ where: { id }, data });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
