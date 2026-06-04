import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;
    const { id } = await params;

    if (userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const body = await req.json();
    const event = await db.clubEvent.update({
      where: { id },
      data: body.eventDate ? { ...body, eventDate: new Date(body.eventDate) } : body,
    });

    return NextResponse.json({ event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '更新活動失敗' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userRole } = auth;
    const { id } = await params;

    if (userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    await db.rSVP.deleteMany({ where: { eventId: id } });
    await db.clubEvent.delete({ where: { id } });

    return NextResponse.json({ message: '活動已刪除' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '刪除活動失敗' }, { status: 500 });
  }
}
