import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const client = await db.customer.findUnique({
      where: { id },
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        orders: { include: { product: true, commissions: true } },
      },
    });
    if (!client) return NextResponse.json({ error: '客戶不存在' }, { status: 404 });
    return NextResponse.json({ client });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}