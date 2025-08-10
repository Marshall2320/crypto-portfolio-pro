
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const rows = await prisma.farmingPos.findMany({ where: { portfolioId: params.id }, orderBy: { date: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const p = await prisma.farmingPos.create({
    data: {
      portfolioId: params.id,
      date: new Date(body.date || Date.now()),
      platform: body.platform||null,
      asset: String(body.asset||'').toUpperCase(),
      qty: body.qty,
      apr: body.apr||null,
      rewardsAsset: body.rewardsAsset ? String(body.rewardsAsset).toUpperCase() : null,
      rewardsQty: body.rewardsQty||0,
      note: body.note||null
    }
  });
  return NextResponse.json(p);
}
