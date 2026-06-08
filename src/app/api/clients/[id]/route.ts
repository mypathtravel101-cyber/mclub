import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await db.client.findUnique({ where: { id }, include: { agent: { select: { id: true, name: true, email: true } }, orders: { include: { product: true, commissions: true } }, timelineEvents: { include: { createdBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' } } } });
    if (!client) return NextResponse.json({ error: '客戶不存在' }, { status: 404 });
    return NextResponse.json({ client });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
