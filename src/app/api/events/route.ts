import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    let events;
    if (userRole === 'MCLUB_STAFF') {
      // MCLUB Admin sees all events with full details
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
      // Other roles see published events + their own RSVPs
      events = await db.clubEvent.findMany({
        where: { 
          status: 'PUBLISHED',
        },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          rsvps: { where: { userId }, include: { user: { select: { id: true, name: true } } } },
          _count: { select: { rsvps: true } },
        },
        orderBy: { eventDate: 'desc' },
      });
    }

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Events API error:', error);
    return NextResponse.json({ error: error.message || '獲取活動列表失敗' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    // Only MCLUB_STAFF can create events
    if (userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, category, venue, eventDate, endDate, maxAttendees, isPublic, fee, currency, status, coverImage, contactPerson, sponsor } = body;

    if (!title || !eventDate) {
      return NextResponse.json({ error: '活動名稱和日期為必填' }, { status: 400 });
    }

    const event = await db.clubEvent.create({
      data: {
        title,
        description: description || null,
        category: category || 'networking',
        venue: venue || null,
        eventDate: new Date(eventDate),
        endDate: endDate ? new Date(endDate) : null,
        maxAttendees: maxAttendees || null,
        isPublic: isPublic !== false,
        fee: fee || 0,
        currency: currency || 'HKD',
        status: status || 'DRAFT',
        coverImage: coverImage || null,
        contactPerson: contactPerson || null,
        sponsor: sponsor || null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ event });
  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: error.message || '創建活動失敗' }, { status: 500 });
  }
}
