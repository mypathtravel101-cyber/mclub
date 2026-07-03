import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const count = await db.notification.count({
      where: {
        userId: auth.userId,
        read: false,
      },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
