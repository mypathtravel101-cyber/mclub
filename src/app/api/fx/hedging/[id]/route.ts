import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getUserAuth(req);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    const existing = await db.hedgingMatch.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: '找不到記錄' }, { status: 404 });
    if (existing.userId !== auth.userId && auth.userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '無權操作' }, { status: 403 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await db.hedgingMatch.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ hedgingMatch: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getUserAuth(req);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await db.hedgingMatch.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: '找不到記錄' }, { status: 404 });
    if (existing.userId !== auth.userId && auth.userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '無權操作' }, { status: 403 });
    }

    await db.hedgingMatch.delete({ where: { id } });
    return NextResponse.json({ message: '已刪除' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
