import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            commissions: true,
            referrals: true,
            events: true,
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: '用戶不存在' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const data = await req.json();

    // Check if admin is updating another user's profile
    const isAdmin = auth.role === 'admin';
    const isSelf = auth.userId === id;

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: '無權限修改他人資料' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    // Admin-only: can change role and status
    if (isAdmin && !isSelf) {
      if (data.role !== undefined) {
        if (!['admin', 'director'].includes(data.role)) {
          return NextResponse.json({ error: '無效的角色' }, { status: 400 });
        }
        updateData.role = data.role;
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, phone: true, role: true, avatar: true, createdAt: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    // Only admin can delete users
    const roleCheck = requireRole(auth, 'admin');
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { id } = await params;

    // Prevent self-deletion
    if (auth.userId === id) {
      return NextResponse.json({ error: '不能刪除自己的帳號' }, { status: 400 });
    }

    // Check user exists
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: '用戶不存在' }, { status: 404 });
    }

    // Delete related records first (no DB-level cascade)
    await db.commission.deleteMany({ where: { agentId: id } });
    await db.eventParticipant.deleteMany({ where: { userId: id } });
    await db.notification.deleteMany({ where: { userId: id } });
    await db.notice.deleteMany({ where: { authorId: id } });
    await db.customer.updateMany({ where: { referrerId: id }, data: { referrerId: null } });
    // agentId is non-nullable on Order, so we must delete those orders
    await db.order.deleteMany({ where: { agentId: id } });
    await db.user.delete({ where: { id } });

    return NextResponse.json({ message: '用戶已刪除' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
