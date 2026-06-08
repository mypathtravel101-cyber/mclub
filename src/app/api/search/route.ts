import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    const q = req.nextUrl.searchParams.get('q') || '';
    if (q.length < 1) {
      return NextResponse.json({ clients: [], orders: [], events: [] });
    }

    const searchTerm = `%${q}%`;

    // ── Search Clients ──
    let clients: any[] = [];
    if (userRole === 'MCLUB_STAFF' || userRole === 'AGENT') {
      const where: any = {
        OR: [
          { name: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
        ],
      };
      if (userRole === 'AGENT') {
        where.agentId = userId;
      }
      clients = await db.client.findMany({
        where,
        select: { id: true, name: true, phone: true, email: true, memberLevel: true },
        take: 5,
      });
    }

    // ── Search Orders ──
    let orders: any[] = [];
    const orderWhere: any = {
      OR: [
        { product: { name: { contains: q } } },
        { client: { name: { contains: q } } },
      ],
    };
    if (userRole === 'AGENT') {
      orderWhere.agentId = userId;
    } else if (userRole === 'SME_OWNER') {
      const products = await db.product.findMany({ where: { smeOwnerId: userId }, select: { id: true } });
      const productIds = products.map(p => p.id);
      orderWhere.productId = { in: productIds };
    } else if (userRole === 'END_USER') {
      orderWhere.endUserId = userId;
    }
    orders = await db.order.findMany({
      where: orderWhere,
      select: { id: true, amount: true, currency: true, status: true, product: { select: { name: true, icon: true } }, client: { select: { name: true } } },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // ── Search Events ──
    const events = await db.clubEvent.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { venue: { contains: q } },
        ],
        status: { in: ['PUBLISHED', 'DRAFT'] },
      },
      select: { id: true, title: true, venue: true, eventDate: true, status: true },
      take: 5,
      orderBy: { eventDate: 'desc' },
    });

    return NextResponse.json({ clients, orders, events });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
