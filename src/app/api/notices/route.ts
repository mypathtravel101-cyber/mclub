import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth-helpers';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause based on user role from JWT
    const where: Record<string, unknown> = { isActive: true };
    if (auth.role !== 'admin') {
      where.targetRoles = { contains: auth.role };
    }

    const notices = await db.notice.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json(notices);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 });
  }
}

const noticeSchema = z.object({
  title: z.string().min(1, '公告標題不能為空'),
  content: z.string().min(1, '公告內容不能為空'),
  category: z.enum(['announcement', 'urgent', 'policy']).default('announcement'),
  targetRoles: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const roleCheck = requireRole(auth, 'admin');
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await request.json();
    const parsed = noticeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const notice = await db.notice.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        category: parsed.data.category,
        targetRoles: parsed.data.targetRoles,
        authorId: auth.userId,
        isPinned: false,
        isActive: true,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Create notifications for all target users
    const roles = parsed.data.targetRoles.split(',');
    const users = await db.user.findMany({
      where: { role: { in: roles } },
      select: { id: true },
    });

    const categoryLabel: Record<string, string> = {
      announcement: '公告',
      urgent: '緊急公告',
      policy: '政策更新',
    };

    for (const user of users) {
      if (user.id !== auth.userId) {
        await db.notification.create({
          data: {
            userId: user.id,
            title: `📢 ${categoryLabel[parsed.data.category] || '公告'}`,
            message: parsed.data.title,
            type: parsed.data.category === 'urgent' ? 'warning' : 'info',
          },
        });
      }
    }

    return NextResponse.json(notice, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const roleCheck = requireRole(auth, 'admin');
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await request.json();
    const { id, ...rawData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing notice id' }, { status: 400 });
    }

    // Validate update data
    const updateSchema = z.object({
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      category: z.enum(['announcement', 'urgent', 'policy']).optional(),
      targetRoles: z.string().min(1).optional(),
      isPinned: z.boolean().optional(),
      isActive: z.boolean().optional(),
    });

    const parsed = updateSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const notice = await db.notice.update({
      where: { id },
      data: parsed.data,
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json(notice);
  } catch {
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const roleCheck = requireRole(auth, 'admin');
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing notice id' }, { status: 400 });
    }

    // Soft delete
    await db.notice.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
  }
}
