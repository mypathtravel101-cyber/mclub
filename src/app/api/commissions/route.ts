import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth-helpers';
import { parsePagination, paginatedResponse, getSkipTake } from '@/lib/pagination';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const params = parsePagination(new URL(request.url).searchParams);
    const { skip, take } = getSkipTake(params);

    // Directors only see their own commissions; admin see all
    const where: Record<string, unknown> = auth.role === 'director' ? { agentId: auth.userId } : {};

    // Filter by status if provided
    const status = new URL(request.url).searchParams.get('status');
    if (status) {
      where.status = status;
    }

    const [commissions, total, paidTotal, pendingTotal] = await Promise.all([
      db.commission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          agent: { select: { id: true, name: true } },
          order: {
            select: {
              id: true,
              status: true,
              customer: { select: { name: true } },
              product: { select: { name: true, emoji: true } },
            },
          },
        },
      }),
      db.commission.count({ where }),
      db.commission.aggregate({ where: { ...where, status: 'paid' }, _sum: { amount: true } }),
      db.commission.aggregate({ where: { ...where, status: 'pending' }, _sum: { amount: true } }),
    ]);

    const result = paginatedResponse(commissions, total, params);
    return NextResponse.json({
      ...result,
      totals: {
        paid: paidTotal._sum.amount || 0,
        pending: pendingTotal._sum.amount || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}

const commissionUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['pending', 'approved', 'paid']).optional(),
  amount: z.number().positive('佣金金額必須大於0').optional(),
  paidAt: z.string().optional(),
});

export async function PUT(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const roleCheck = requireRole(auth, 'admin');
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await request.json();
    const parsed = commissionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    if (data.status === 'paid' && !data.paidAt) {
      data.paidAt = new Date().toISOString();
    }

    const commission = await db.commission.update({ where: { id }, data });
    return NextResponse.json(commission);
  } catch {
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
  }
}
