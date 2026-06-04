import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '未提供用戶ID' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '只有MCLUB Admin可以查看用戶列表' }, { status: 403 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        referredById: true,
        referredBy: { select: { id: true, name: true } },
        createdAt: true,
        _count: {
          select: {
            ownedProducts: true,
            clients: true,
            orders: true,
            commissions: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: '獲取用戶列表失敗' }, { status: 500 });
  }
}
