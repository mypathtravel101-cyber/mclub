import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET: List notifications for user
export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId } = auth;

    const unread = req.nextUrl.searchParams.get('unread');
    const where: any = { userId };
    if (unread === 'true') where.read = false;

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await db.notification.count({
      where: { userId, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: error.message || '獲取通知失敗' }, { status: 500 });
  }
}

// POST: Create notification (MCLUB_STAFF can send to specific user or broadcast)
export async function POST(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userRole } = auth;

    if (userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const body = await req.json();
    const { userId: targetUserId, type, title, message, link, broadcast } = body;

    if (!type || !title || !message) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
    }

    if (broadcast) {
      // Send to all users
      const allUsers = await db.user.findMany({ select: { id: true } });
      await db.notification.createMany({
        data: allUsers.map(u => ({ userId: u.id, type, title, message, link: link || null })),
      });
      return NextResponse.json({ message: '已向所有用戶發送通知', count: allUsers.length });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: '請指定用戶或使用廣播模式' }, { status: 400 });
    }

    const notification = await db.notification.create({
      data: { userId: targetUserId, type, title, message, link: link || null },
    });

    return NextResponse.json({ notification });
  } catch (error: any) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({ error: error.message || '創建通知失敗' }, { status: 500 });
  }
}

// PATCH: Mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId } = auth;

    const body = await req.json();
    if (body.action === 'markAllRead') {
      await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ message: '已全部標為已讀' });
    }

    return NextResponse.json({ error: '無效操作' }, { status: 400 });
  } catch (error: any) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ error: error.message || '操作失敗' }, { status: 500 });
  }
}
