import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    let events;
    if (userRole === 'MCLUB_STAFF') {
      events = await db.clubEvent.findMany({
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          rsvps: { include: { user: { select: { id: true, name: true, role: true, email: true } } }, orderBy: { createdAt: 'desc' } },
          _count: { select: { rsvps: true, tasks: true, budgetItems: true } },
          tasks: { include: { assignee: { select: { id: true, name: true } } }, orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }] },
          budgetItems: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { eventDate: 'desc' },
      });
    } else {
      events = await db.clubEvent.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          rsvps: { where: { userId }, include: { user: { select: { id: true, name: true } } } },
          _count: { select: { rsvps: true } },
        },
        orderBy: { eventDate: 'desc' },
      });
    }

    return NextResponse.json({ events }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error: any) {
    console.error('Events API error:', error);
    return NextResponse.json({ error: error.message || '獲取活動列表失敗' }, { status: 500 });
  }
}
