import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

export async function PUT(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const result = await db.notification.updateMany({
      where: {
        userId: auth.userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ count: result.count });
  } catch {
    return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
  }
}
