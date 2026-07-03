import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {};
    if (roleFilter) {
      where.role = { in: roleFilter.split(',') };
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Allow all authenticated users to list users (for director selector etc.)
    // but restrict full details to admin
    const isAdmin = auth.role === 'admin';

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: isAdmin,
          role: true,
          avatar: isAdmin,
          createdAt: isAdmin,
          ...(isAdmin ? {
            _count: {
              select: {
                orders: true,
                commissions: true,
                referrals: true,
              },
            },
          } : {}),
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({ data: users, total, page, pageSize });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: '獲取用戶列表失敗' }, { status: 500 });
  }
}
