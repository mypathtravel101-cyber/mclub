import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    let commissions;
    if (userRole === 'MCLUB_STAFF') {
      commissions = await db.commission.findMany({ include: { order: { include: { product: { select: { name: true, icon: true } }, client: { select: { name: true } } } }, recipient: { select: { name: true, role: true } } }, orderBy: { createdAt: 'desc' } });
    } else {
      commissions = await db.commission.findMany({ where: { recipientId: userId }, include: { order: { include: { product: { select: { name: true, icon: true } }, client: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' } });
    }
    return NextResponse.json({ commissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
