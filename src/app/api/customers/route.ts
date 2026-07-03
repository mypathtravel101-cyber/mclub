import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { parsePagination, paginatedResponse, getSkipTake } from '@/lib/pagination';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const params = parsePagination(new URL(request.url).searchParams);
    const { skip, take } = getSkipTake(params);

    // Build where clause with search
    const where: Record<string, unknown> = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { email: { contains: params.search } },
        { company: { contains: params.search } },
        { phone: { contains: params.search } },
      ];
    }

    // Directors see their own clients (orders assigned to them) plus all
    // customers who registered for events (auto-created from public registration).
    if (auth.role === 'director') {
      const searchConditions = params.search
        ? [
            { name: { contains: params.search } },
            { email: { contains: params.search } },
            { company: { contains: params.search } },
            { phone: { contains: params.search } },
          ]
        : [];
      if (searchConditions.length) {
        where.OR = [
          { AND: [{ orders: { some: { agentId: auth.userId } } }, { OR: searchConditions }] },
          { AND: [{ eventRegistrations: { some: {} } }, { OR: searchConditions }] },
        ];
      } else {
        where.OR = [
          { orders: { some: { agentId: auth.userId } } },
          { eventRegistrations: { some: {} } },
        ];
      }
    }

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          referrer: { select: { id: true, name: true } },
          orders: {
            select: {
              id: true,
              status: true,
              product: { select: { id: true, name: true, emoji: true } },
              agent: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          eventRegistrations: {
            select: {
              id: true,
              status: true,
              guests: true,
              event: { select: { id: true, title: true, date: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      db.customer.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(customers, total, params));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

const customerSchema = z.object({
  name: z.string().min(1, '客戶姓名不能為空'),
  email: z.string().email('無效的電郵格式').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  nationality: z.string().optional(),
  status: z.enum(['active', 'inactive', 'prospect']).default('prospect'),
});

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const data = {
      ...parsed.data,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      nationality: parsed.data.nationality || null,
    };

    const customer = await db.customer.create({ data });
    return NextResponse.json(customer, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

const customerUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '客戶姓名不能為空').optional(),
  email: z.string().email('無效的電郵格式').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  nationality: z.string().optional(),
  status: z.enum(['active', 'inactive', 'prospect']).optional(),
  notes: z.string().optional(),
  referrerId: z.string().optional(),
});

export async function PUT(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = customerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    // Convert empty strings to null for optional fields
    if (data.email === '') data.email = null as unknown as undefined;

    const customer = await db.customer.update({ where: { id }, data });
    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
