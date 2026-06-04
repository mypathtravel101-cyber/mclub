import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; budgetId: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userRole } = auth;
    const { budgetId } = await params;

    if (userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const body = await req.json();
    const budgetItem = await db.eventBudgetItem.update({
      where: { id: budgetId },
      data: {
        ...(body.category !== undefined && { category: body.category }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.estimatedCost !== undefined && { estimatedCost: body.estimatedCost }),
        ...(body.actualCost !== undefined && { actualCost: body.actualCost }),
      },
    });

    return NextResponse.json({ budgetItem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '更新預算項目失敗' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; budgetId: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userRole } = auth;
    const { budgetId } = await params;

    if (userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    await db.eventBudgetItem.delete({ where: { id: budgetId } });

    return NextResponse.json({ message: '預算項目已刪除' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '刪除預算項目失敗' }, { status: 500 });
  }
}
