import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, comparePassword, hashPassword } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '請輸入目前密碼'),
  newPassword: z.string().min(6, '新密碼至少需要6個字符'),
});

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: '未登入或登入已過期' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: '用戶不存在' }, { status: 404 });

    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: '目前密碼不正確' }, { status: 401 });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await db.user.update({
      where: { id: payload.userId },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({ message: '密碼已更新' });
  } catch {
    return NextResponse.json({ error: '更新密碼失敗' }, { status: 500 });
  }
}
