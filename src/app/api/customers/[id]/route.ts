import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: { select: { id: true, name: true, emoji: true, category: true } },
            agent: { select: { id: true, name: true } },
            commissions: {
              select: { id: true, amount: true, status: true, createdAt: true },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: '客戶不存在' }, { status: 404 });
    }

    // Directors can only view their own clients
    if (auth.role === 'director') {
      const hasAccess = customer.orders.some((o: { agentId: string | null }) => o.agentId === auth.userId);
      if (!hasAccess) {
        return NextResponse.json({ error: '沒有權限查看此客戶' }, { status: 403 });
      }
    }

    // Calculate summary stats
    const totalSpent = customer.orders
      .filter((o) => o.status === 'completed' || o.status === 'processing')
      .reduce((sum, o) => sum + o.amount, 0);

    const totalCommission = customer.orders
      .flatMap((o) => o.commissions)
      .reduce((sum, c) => sum + c.amount, 0);

    return NextResponse.json({
      ...customer,
      _stats: {
        totalOrders: customer.orders.length,
        totalSpent,
        totalCommission,
        pendingOrders: customer.orders.filter((o) => o.status === 'pending').length,
        completedOrders: customer.orders.filter((o) => o.status === 'completed').length,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await request.json();

    const customer = await db.customer.update({
      where: { id },
      data: body,
      include: {
        referrer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Only admin can delete customers
    if (auth.role !== 'admin') {
      return NextResponse.json({ error: '只有管理員可以刪除客戶' }, { status: 403 });
    }

    const { id } = await params;

    const customer = await db.customer.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!customer) {
      return NextResponse.json({ error: '客戶不存在' }, { status: 404 });
    }

    // Hard delete: clean up all related records in dependency order
    // 1. Delete commissions linked to this customer's orders
    const orderIds = await db.order.findMany({
      where: { customerId: id },
      select: { id: true },
    });
    if (orderIds.length > 0) {
      await db.commission.deleteMany({
        where: { orderId: { in: orderIds.map((o) => o.id) } },
      });
      await db.order.deleteMany({ where: { customerId: id } });
    }

    // 2. Unlink event registrations (keep the registration, just remove the link)
    await db.eventRegistration.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    });

    // 3. Delete the customer
    await db.customer.delete({ where: { id } });
    return NextResponse.json({ message: '客戶已刪除' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
