import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const commissions = await db.commission.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agent: { select: { id: true, name: true } },
        order: {
          select: {
            id: true,
            customer: { select: { name: true } },
            product: { select: { name: true, emoji: true } },
          },
        },
      },
    });
    return NextResponse.json(commissions);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const commission = await db.commission.update({ where: { id }, data });
    return NextResponse.json(commission);
  } catch {
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
  }
}
