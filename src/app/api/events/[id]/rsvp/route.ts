import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId } = auth;
    const { id: eventId } = await params;

    const body = await req.json();
    const { status, notes, guests } = body;

    // Check event exists and is published
    const event = await db.clubEvent.findUnique({ where: { id: eventId }, include: { _count: { select: { rsvps: true } } } });
    if (!event) return NextResponse.json({ error: '活動不存在' }, { status: 404 });
    if (event.status !== 'PUBLISHED') return NextResponse.json({ error: '活動未開放報名' }, { status: 400 });

    // Check capacity
    if (event.maxAttendees && event._count.rsvps >= event.maxAttendees) {
      return NextResponse.json({ error: '活動人數已滿' }, { status: 400 });
    }

    const rsvp = await db.rSVP.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: { status: status || 'CONFIRMED', notes: notes || null, guests: guests || 0 },
      create: { eventId, userId, status: status || 'CONFIRMED', notes: notes || null, guests: guests || 0 },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ rsvp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'RSVP失敗' }, { status: 500 });
  }
}
