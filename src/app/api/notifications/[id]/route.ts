import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// PATCH: Mark single notification as read
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId } = auth;
    const { id } = await params;

    const notification = await db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return NextResponse.json({ error: '通知不存在' }, { status: 404 });
    }

    const updated = await db.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ notification: updated });
  } catch (error: any) {
    console.error('Notification PATCH error:', error);
    return NextResponse.json({ error: error.message || '操作失敗' }, { status: 500 });
  }
}

// DELETE: Delete notification
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId } = auth;
    const { id } = await params;

    const notification = await db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return NextResponse.json({ error: '通知不存在' }, { status: 404 });
    }

    await db.notification.delete({ where: { id } });

    return NextResponse.json({ message: '已刪除' });
  } catch (error: any) {
    console.error('Notification DELETE error:', error);
    return NextResponse.json({ error: error.message || '刪除失敗' }, { status: 500 });
  }
}
