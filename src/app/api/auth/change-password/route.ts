import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

// Same simple hash as login route
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId } = auth;

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '請輸入目前密碼和新密碼' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密碼至少需要6個字符' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: '用戶不存在' }, { status: 404 });

    if (user.password !== simpleHash(currentPassword)) {
      return NextResponse.json({ error: '目前密碼不正確' }, { status: 401 });
    }

    await db.user.update({
      where: { id: userId },
      data: { password: simpleHash(newPassword) },
    });

    return NextResponse.json({ message: '密碼已更新' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
