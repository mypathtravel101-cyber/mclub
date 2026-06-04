import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { id: eventId } = await params;

    const tasks = await db.eventTask.findMany({
      where: { eventId },
      include: { assignee: { select: { id: true, name: true, role: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '獲取任務失敗' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;
    const { id: eventId } = await params;

    // Only MCLUB_STAFF can create tasks
    if (userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, status, dueDate, priority, assigneeId } = body;

    if (!title) {
      return NextResponse.json({ error: '任務名稱為必填' }, { status: 400 });
    }

    const task = await db.eventTask.create({
      data: {
        eventId,
        title,
        description: description || null,
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        assigneeId: assigneeId || null,
      },
      include: { assignee: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '創建任務失敗' }, { status: 500 });
  }
}
