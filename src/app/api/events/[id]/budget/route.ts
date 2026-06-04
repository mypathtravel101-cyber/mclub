// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { id: eventId } = await params;

    const budgetItems = await db.eventBudgetItem.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });

    const totalEstimated = budgetItems.reduce((sum, item) => sum + item.estimatedCost, 0);
    const totalActual = budgetItems.reduce((sum, item) => sum + (item.actualCost || 0), 0);

    return NextResponse.json({ budgetItems, totalEstimated, totalActual });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '獲取預算失敗' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userRole } = auth;
    const { id: eventId } = await params;

    if (userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const body = await req.json();
    const { category, description, estimatedCost, actualCost } = body;

    if (!description) {
      return NextResponse.json({ error: '項目描述為必填' }, { status: 400 });
    }

    const budgetItem = await db.eventBudgetItem.create({
      data: {
        eventId,
        category: category || 'other',
        description,
        estimatedCost: estimatedCost || 0,
        actualCost: actualCost != null ? actualCost : null,
      },
    });

    return NextResponse.json({ budgetItem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '創建預算項目失敗' }, { status: 500 });
  }
}
