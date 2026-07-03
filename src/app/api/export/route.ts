import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

function csvEscape(val: unknown): string {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCSVRow(fields: unknown[]): string {
  return fields.map(csvEscape).join(',');
}

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'customers';
    const date = new Date().toISOString().slice(0, 10);

    const BOM = '\uFEFF';
    let csv = '';

    if (type === 'customers') {
      const where = auth.role === 'director' ? { orders: { some: { agentId: auth.userId } } } : {};
      const customers = await db.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { referrer: { select: { name: true } } },
      });

      csv = BOM + toCSVRow(['姓名', '電郵', '電話', '公司', '國籍', '狀態', '推薦人', '建立日期']) + '\n';
      for (const c of customers) {
        const statusLabel: Record<string, string> = { active: '活躍', inactive: '非活躍', prospect: '潛在客戶' };
        csv += toCSVRow([c.name, c.email || '', c.phone || '', c.company || '', c.nationality || '', statusLabel[c.status] || c.status, c.referrer?.name || '', new Date(c.createdAt).toLocaleDateString('zh-HK')]) + '\n';
      }
    } else if (type === 'orders') {
      const where: Record<string, unknown> = auth.role === 'director' ? { agentId: auth.userId } : {};
      const orders = await db.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          product: { select: { name: true, emoji: true } },
          agent: { select: { name: true } },
        },
      });

      const statusLabel: Record<string, string> = { pending: '待處理', processing: '處理中', completed: '已完成', cancelled: '已取消' };
      csv = BOM + toCSVRow(['訂單ID', '產品', '客戶', '金額', '貨幣', '佣金', '狀態', '總監', '建立日期']) + '\n';
      for (const o of orders) {
        csv += toCSVRow([o.id.slice(0, 8), `${o.product.emoji} ${o.product.name}`, o.customer.name, o.amount.toLocaleString(), o.currency, o.commission.toLocaleString(), statusLabel[o.status] || o.status, o.agent.name, new Date(o.createdAt).toLocaleDateString('zh-HK')]) + '\n';
      }
    } else if (type === 'commissions') {
      const where = auth.role === 'director' ? { agentId: auth.userId } : {};
      const commissions = await db.commission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: { select: { name: true, role: true } },
          order: {
            select: {
              customer: { select: { name: true } },
              product: { select: { name: true, emoji: true } },
            },
          },
        },
      });

      const statusLabel: Record<string, string> = { pending: '待審批', approved: '已審批', paid: '已支付' };
      csv = BOM + toCSVRow(['總監', '產品', '客戶', '金額', '貨幣', '狀態', '支付日期', '建立日期']) + '\n';
      for (const c of commissions) {
        csv += toCSVRow([c.agent.name, c.order ? `${c.order.product.emoji} ${c.order.product.name}` : '', c.order?.customer.name || '', c.amount.toLocaleString(), c.currency, statusLabel[c.status] || c.status, c.paidAt ? new Date(c.paidAt).toLocaleDateString('zh-HK') : '', new Date(c.createdAt).toLocaleDateString('zh-HK')]) + '\n';
      }
    } else {
      return NextResponse.json({ error: '無效的匯出類型。可用: customers, orders, commissions' }, { status: 400 });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=mclub_${type}_${date}.csv`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: '匯出失敗' }, { status: 500 });
  }
}
