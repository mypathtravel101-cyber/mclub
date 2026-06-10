import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userRole = searchParams.get('role') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause: only active notices, and if role is provided, filter by targetRoles
    const where: Record<string, unknown> = { isActive: true };

    // If a specific role is given, filter notices that target that role
    // targetRoles is comma-separated, e.g. "admin,sme,agent,client"
    if (userRole && userRole !== 'admin') {
      // Non-admin users only see notices targeting their role
      where.targetRoles = { contains: userRole };
    }
    // Admin can see all active notices (no targetRoles filter)

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, category, targetRoles, authorId, isPinned } = body;

    if (!title || !content || !authorId) {
      return NextResponse.json({ error: 'Missing required fields: title, content, authorId' }, { status: 400 });
    }

    // Verify the author is an admin
    const author = await db.user.findUnique({ where: { id: authorId } });
    if (!author || author.role !== 'admin') {
      return NextResponse.json({ error: 'Only admin can create notices' }, { status: 403 });
    }

    const notice = await db.notice.create({
      data: {
        title,
        content,
        category: category || 'announcement',
        targetRoles: targetRoles || 'admin,sme,agent,client',
        authorId,
        isPinned: isPinned || false,
        isActive: true,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Create notifications for all target users
    const roles = (targetRoles || 'admin,sme,agent,client').split(',');
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
      if (user.id !== authorId) {
        await db.notification.create({
          data: {
            userId: user.id,
            title: `📢 ${categoryLabel[category] || '公告'}`,
            message: `${title}`,
            type: category === 'urgent' ? 'warning' : 'info',
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
    const body = await request.json();
    const { id, authorId, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing notice id' }, { status: 400 });
    }

    // Verify the requester is an admin
    if (authorId) {
      const author = await db.user.findUnique({ where: { id: authorId } });
      if (!author || author.role !== 'admin') {
        return NextResponse.json({ error: 'Only admin can update notices' }, { status: 403 });
      }
    }

    const notice = await db.notice.update({
      where: { id },
      data,
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const authorId = searchParams.get('authorId');

    if (!id) {
      return NextResponse.json({ error: 'Missing notice id' }, { status: 400 });
    }

    // Verify the requester is an admin
    if (authorId) {
      const author = await db.user.findUnique({ where: { id: authorId } });
      if (!author || author.role !== 'admin') {
        return NextResponse.json({ error: 'Only admin can delete notices' }, { status: 403 });
      }
    }

    // Soft delete by setting isActive to false
    await db.notice.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
  }
}
