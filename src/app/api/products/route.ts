import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    let products;
    if (userRole === 'MCLUB_STAFF') {
      products = await db.product.findMany({ include: { smeOwner: { select: { name: true } } }, orderBy: { createdAt: 'asc' } });
    } else if (userRole === 'SME_OWNER') {
      products = await db.product.findMany({ where: { smeOwnerId: userId }, orderBy: { createdAt: 'asc' } });
    } else {
      // Agent and End User see all products but without commission rules
      products = await db.product.findMany({ select: { id: true, name: true, category: true, description: true, keyPoints: true, minInvestment: true, icon: true, color: true, commissionRules: userRole === 'AGENT' ? true : false }, orderBy: { createdAt: 'asc' } });
    }
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
