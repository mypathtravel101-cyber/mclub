// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userRole } = auth;
    const { id: eventId } = await params;

    // Only MCLUB_STAFF can check in attendees
    if (userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const body = await req.json();
    const { rsvpId, checkIn } = body;

    if (!rsvpId) {
      return NextResponse.json({ error: '缺少 RSVP ID' }, { status: 400 });
    }

    const rsvp = await db.rSVP.update({
      where: { id: rsvpId },
      data: { status: checkIn === false ? 'CONFIRMED' : 'CHECKED_IN' },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ rsvp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '簽到失敗' }, { status: 500 });
  }
}
