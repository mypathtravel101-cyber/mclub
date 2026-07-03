import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { parsePagination, paginatedResponse, getSkipTake } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const params = parsePagination(new URL(request.url).searchParams);
    const { skip, take } = getSkipTake(params);

    // Directors only see their own orders; admin see all
    const whereBase: Record<string, unknown> = auth.role === 'director' ? { agentId: auth.userId } : {};

    if (params.search) {
      whereBase.OR = [
        { customer: { name: { contains: params.search } } },
        { product: { name: { contains: params.search } } },
        { agent: { name: { contains: params.search } } },
        { notes: { contains: params.search } },
      ];
    }

    // Filter by status if provided
    const status = new URL(request.url).searchParams.get('status');
    if (status) {
      whereBase.status = status;
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: whereBase,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          customer: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, emoji: true } },
          agent: { select: { id: true, name: true } },
        },
      }),
      db.order.count({ where: whereBase }),
    ]);

    return NextResponse.json(paginatedResponse(orders, total, params));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

const orderSchema = z.object({
  customerId: z.string().min(1, '請選擇客戶'),
  productId: z.string().min(1, '請選擇產品'),
  agentId: z.string().min(1, '請選擇總監'),
  amount: z.number().positive('金額必須大於0'),
  currency: z.string().default('HKD'),
  status: z.enum(['prospect', 'following_up', 'quoted', 'confirmed', 'pending', 'processing', 'completed', 'cancelled']).default('prospect'),
  notes: z.string().optional(),
});

import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const { productId, amount, agentId, ...rest } = parsed.data;
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: '產品不存在' }, { status: 404 });
    }

    // Calculate commission: fixed > rate > negotiable (0)
    let commission = 0;
    if (product.commissionFixed > 0) {
      commission = product.commissionFixed;
    } else if (product.commissionRate > 0) {
      commission = amount * (product.commissionRate / 100);
    }

    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: { ...rest, productId, amount, commission, agentId },
      });

      await tx.commission.create({
        data: {
          agentId,
          orderId: newOrder.id,
          amount: commission,
          currency: rest.currency || 'HKD',
          status: 'pending',
        },
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

const orderUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['prospect', 'following_up', 'quoted', 'confirmed', 'pending', 'processing', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
});

export async function PUT(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = orderUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    const order = await db.order.update({ where: { id }, data });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
