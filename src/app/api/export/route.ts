import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

function csvEscape(val: any): string {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCSVRow(fields: any[]): string {
  return fields.map(csvEscape).join(',');
}

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    const type = req.nextUrl.searchParams.get('type') || 'clients';
    const date = new Date().toISOString().slice(0, 10);

    const BOM = '\uFEFF';
    let csv = '';

    if (type === 'clients') {
      let clients;
      if (userRole === 'MCLUB_STAFF') {
        clients = await db.client.findMany({
          include: { agent: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } else if (userRole === 'AGENT') {
        clients = await db.client.findMany({
          where: { agentId: userId },
          include: { agent: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        clients = [];
      }

      csv = BOM + toCSVRow(['姓名', '電話', '電郵', '等級', '來源', '總消費', 'Agent', '建立日期']) + '\n';
      for (const c of clients) {
        const levelMap: Record<string, string> = { PLAN_A: 'Plan A 入門', PLAN_B: 'Plan B 進階', PLAN_C: 'Plan C 高端', FULL: 'MCLUB全會員' };
        csv += toCSVRow([c.name, c.phone || '', c.email || '', levelMap[c.memberLevel] || c.memberLevel, c.source || '', `HK$${c.totalSpent.toLocaleString()}`, c.agent?.name || '', new Date(c.createdAt).toLocaleDateString('zh-HK')]) + '\n';
      }
    } else if (type === 'orders') {
      let orders;
      if (userRole === 'MCLUB_STAFF') {
        orders = await db.order.findMany({
          include: { product: { select: { name: true } }, client: { select: { name: true } }, agent: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } else if (userRole === 'SME_OWNER') {
        const products = await db.product.findMany({ where: { smeOwnerId: userId }, select: { id: true } });
        const productIds = products.map(p => p.id);
        orders = await db.order.findMany({
          where: { productId: { in: productIds } },
          include: { product: { select: { name: true } }, client: { select: { name: true } }, agent: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } else if (userRole === 'AGENT') {
        orders = await db.order.findMany({
          where: { agentId: userId },
          include: { product: { select: { name: true } }, client: { select: { name: true } }, agent: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        orders = await db.order.findMany({
          where: { endUserId: userId },
          include: { product: { select: { name: true } }, client: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
      }

      const statusMap: Record<string, string> = { PENDING: '待確認', IN_PROGRESS: '進行中', COMPLETED: '已完成', SETTLED: '已分帳' };
      csv = BOM + toCSVRow(['訂單ID', '產品', '客戶', '金額', '貨幣', '狀態', 'Agent', '建立日期']) + '\n';
      for (const o of orders) {
        csv += toCSVRow([o.id.slice(0, 8), o.product?.name || '', o.client?.name || '', `${o.currency === 'USD' ? 'US$' : 'HK$'}${o.amount.toLocaleString()}`, o.currency, statusMap[o.status] || o.status, (o as any).agent?.name || '', new Date(o.createdAt).toLocaleDateString('zh-HK')]) + '\n';
      }
    } else if (type === 'commissions') {
      let commissions;
      if (userRole === 'MCLUB_STAFF') {
        commissions = await db.commission.findMany({
          include: { order: { include: { product: { select: { name: true } }, client: { select: { name: true } } } }, recipient: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        commissions = await db.commission.findMany({
          where: { recipientId: userId },
          include: { order: { include: { product: { select: { name: true } }, client: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' },
        });
      }

      const roleMap: Record<string, string> = { MCLUB_STAFF: 'MCLUB Admin', SME_OWNER: 'SME老闆', AGENT: 'Agent經紀', END_USER: '客戶' };
      csv = BOM + toCSVRow(['訂單ID', '產品', '客戶', '收款人', '角色', '金額', '狀態', '建立日期']) + '\n';
      for (const c of commissions) {
        const recipientName = (c as any).recipient?.name || '';
        const recipientRole = (c as any).recipient?.role || c.role;
        csv += toCSVRow([c.orderId.slice(0, 8), c.order?.product?.name || '', c.order?.client?.name || '', recipientName, roleMap[recipientRole] || recipientRole, `HK$${c.amount.toLocaleString()}`, c.status === 'PAID' ? '已發放' : '待發放', new Date(c.createdAt).toLocaleDateString('zh-HK')]) + '\n';
      }
    } else {
      return NextResponse.json({ error: '無效的匯出類型' }, { status: 400 });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=export_${type}_${date}.csv`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
