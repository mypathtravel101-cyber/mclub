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

    const where: Record<string, unknown> = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { nameEn: { contains: params.search } },
        { category: { contains: params.search } },
      ];
    }

    // Filter by status
    const status = new URL(request.url).searchParams.get('status');
    if (status) where.status = status;

    // Filter by parentId (support "null" for parent-only products)
    const parentIdParam = new URL(request.url).searchParams.get('parentId');
    if (parentIdParam === 'null') {
      where.parentId = null;
    } else if (parentIdParam) {
      where.parentId = parentIdParam;
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take,
        include: {
          children: true,
        },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(products, total, params));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

const productSchema = z.object({
  name: z.string().min(1, '產品名稱不能為空'),
  nameEn: z.string().min(1, 'English name is required'),
  emoji: z.string().min(1),
  description: z.string().min(1, '產品描述不能為空'),
  descriptionEn: z.string().min(1),
  category: z.string().min(1),
  priceMin: z.number().min(0),
  priceMax: z.number().min(0),
  currency: z.string().default('HKD'),
  commissionRate: z.number().min(0).max(100),
  commissionFixed: z.number().min(0).default(0),
  commissionNegotiable: z.boolean().default(false),
  parentId: z.string().optional(),
  attachmentUrl: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Only admin can create products
    const roleCheck = requireRole(auth, 'admin');
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const product = await db.product.create({ data: parsed.data });
    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

const productUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  nameEn: z.string().optional(),
  emoji: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  category: z.string().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  currency: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  commissionFixed: z.number().min(0).optional(),
  commissionNegotiable: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
  attachmentUrl: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
});

export async function PUT(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Only admin can edit products
    const roleCheck = requireRole(auth, 'admin');
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await request.json();
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    const product = await db.product.update({ where: { id }, data });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
