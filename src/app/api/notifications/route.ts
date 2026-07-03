import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { parsePagination, paginatedResponse, getSkipTake } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const params = parsePagination(new URL(request.url).searchParams);
    const { skip, take } = getSkipTake(params);

    // Users can only see their own notifications
    const where = { userId: auth.userId };

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      db.notification.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(notifications, total, params));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

const notificationUpdateSchema = z.object({
  id: z.string().min(1),
  read: z.boolean().optional(),
});

import { z } from 'zod';

export async function PUT(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = notificationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    // Verify the notification belongs to this user
    const notification = await db.notification.findUnique({ where: { id: parsed.data.id } });
    if (!notification || notification.userId !== auth.userId) {
      return NextResponse.json({ error: '通知不存在或無權操作' }, { status: 403 });
    }

    const updated = await db.notification.update({
      where: { id: parsed.data.id },
      data: { read: parsed.data.read },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
