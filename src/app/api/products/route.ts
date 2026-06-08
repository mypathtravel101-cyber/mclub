import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    let products;
    if (userRole === 'MCLUB_STAFF') {
      products = await db.product.findMany({ include: { smeOwner: { select: { name: true } } }, orderBy: { createdAt: 'asc' } });
    } else if (userRole === 'SME_OWNER') {
      products = await db.product.findMany({ where: { smeOwnerId: userId }, include: { smeOwner: { select: { name: true } } }, orderBy: { createdAt: 'asc' } });
    } else {
      // Agent and End User see all products but without commission rules
      products = await db.product.findMany({ select: { id: true, name: true, category: true, description: true, keyPoints: true, minInvestment: true, icon: true, color: true, commissionRules: userRole === 'AGENT' ? true : false, smeOwnerId: true, smeOwner: { select: { name: true } } }, orderBy: { createdAt: 'asc' } });
    }
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    if (userRole !== 'MCLUB_STAFF' && userRole !== 'SME_OWNER') {
      return NextResponse.json({ error: '無權限' }, { status: 403 });
    }

    const data = await req.json();
    const smeOwnerId = userRole === 'SME_OWNER' ? userId : (data.smeOwnerId || userId);

    const product = await db.product.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description || '',
        keyPoints: data.keyPoints || '[]',
        minInvestment: data.minInvestment || null,
        smeOwnerId,
        commissionRules: data.commissionRules || '{"agentRate":0,"smeRate":0,"mclubRate":0,"type":"percent"}',
        icon: data.icon || null,
        color: data.color || null,
      },
      include: { smeOwner: { select: { name: true } } },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    const data = await req.json();
    if (!data.id) return NextResponse.json({ error: '缺少產品ID' }, { status: 400 });

    // Check ownership for SME_OWNER
    if (userRole === 'SME_OWNER') {
      const product = await db.product.findUnique({ where: { id: data.id } });
      if (!product || product.smeOwnerId !== userId) {
        return NextResponse.json({ error: '無權限編輯此產品' }, { status: 403 });
      }
    } else if (userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '無權限' }, { status: 403 });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.keyPoints !== undefined) updateData.keyPoints = data.keyPoints;
    if (data.minInvestment !== undefined) updateData.minInvestment = data.minInvestment;
    if (data.commissionRules !== undefined) updateData.commissionRules = data.commissionRules;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.smeOwnerId !== undefined && userRole === 'MCLUB_STAFF') updateData.smeOwnerId = data.smeOwnerId;

    const product = await db.product.update({
      where: { id: data.id },
      data: updateData,
      include: { smeOwner: { select: { name: true } } },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserAuth(req);
    if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 });
    const { userId, userRole } = auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少產品ID' }, { status: 400 });

    // Check ownership for SME_OWNER
    if (userRole === 'SME_OWNER') {
      const product = await db.product.findUnique({ where: { id } });
      if (!product || product.smeOwnerId !== userId) {
        return NextResponse.json({ error: '無權限刪除此產品' }, { status: 403 });
      }
    } else if (userRole !== 'MCLUB_STAFF') {
      return NextResponse.json({ error: '無權限' }, { status: 403 });
    }

    await db.product.delete({ where: { id } });
    return NextResponse.json({ message: '產品已刪除' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
