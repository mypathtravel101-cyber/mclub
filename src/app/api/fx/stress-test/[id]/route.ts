import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getUserAuth(req);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const { id } = await params;
    const test = await db.fXStressTest.findUnique({
      where: { id },
    });

    if (!test) return NextResponse.json({ error: '找不到測試記錄' }, { status: 404 });
    if (test.userId !== auth.userId && auth.userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '無權查看' }, { status: 403 });
    }

    return NextResponse.json({ stressTest: test });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
