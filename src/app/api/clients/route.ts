import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

// Clients route redirects to customers model for consistency
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { userId, role } = auth;

    let customers;
    if (role === 'admin') {
      customers = await db.customer.findMany({
        include: {
          referrer: { select: { id: true, name: true } },
          orders: { include: { product: { select: { name: true, emoji: true } } } },
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'director') {
      customers = await db.customer.findMany({
        where: { referrerId: userId },
        include: {
          orders: { include: { product: { select: { name: true, emoji: true } } } },
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      customers = [];
    }
    return NextResponse.json({ clients: customers });
  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json({ error: '獲取客戶列表失敗' }, { status: 500 });
  }
}
