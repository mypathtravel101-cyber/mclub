import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hashPassword, signToken } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1, '請輸入姓名').max(50, '姓名不能超過50個字符'),
  email: z.string().email('無效的電子郵件格式'),
  password: z.string().min(6, '密碼至少需要6個字符'),
  phone: z.string().optional(),
  role: z.enum(['director'], { message: '請選擇有效角色' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const { name, email, password, phone, role } = parsed.data;

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: '此電子郵件已被註冊' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        phone: phone || null,
      },
    });

    // Auto-login after registration — issue JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = signToken(tokenPayload);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: '註冊失敗，請稍後再試' }, { status: 500 });
  }
}
